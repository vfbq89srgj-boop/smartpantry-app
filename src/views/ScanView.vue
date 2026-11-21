<!--
  Receipt scan – MVP step 1.
  1. Take a photo (camera) or pick one from the gallery
  2. Resize it in the app (max. 1,500 px)
  3. Send it to the backend → AI reads the items
  4. Review list: edit, delete, add – then confirm
  5. Save to the pantry
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import {
  Camera,
  ChevronLeft,
  ImageUp,
  Plus,
  RotateCcw,
} from "@lucide/vue";
import ReviewItem from "../components/ReviewItem.vue";
import { resizeImage } from "../lib/image";
import { localDateString } from "../lib/date";
import {
  analyzeReceipt,
  DuplicateReceiptError,
  ScanError,
  type ScannedItem,
} from "../api/receipts";
import ScanIcon from "../components/ScanIcon.vue";
import { addItems, type StoragePlace } from "../data/pantry";

const router = useRouter();

type Step = "start" | "analyzing" | "review" | "error";
const step = ref<Step>("start");
const errorMessage = ref("");
const items = ref<ScannedItem[]>([]);
const reference = ref({
  date: localDateString(),
  source: "currentDate",
});
const saving = ref(false);
const saveError = ref("");
const fileHash = ref<string | null>(null); // from POST /Receipts, sent back unchanged with the items
const duplicate = ref(false); // true = the backend said 409 "already saved"
let lastImage: Blob | undefined; // kept so "Add anyway" can upload the same photo again

// Two hidden file inputs: one opens the camera, one the photo library
const cameraInput = ref<HTMLInputElement>();
const galleryInput = ref<HTMLInputElement>();

async function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ""; // allows choosing the same photo again
  if (!file) return;

  step.value = "analyzing";
  duplicate.value = false;
  try {
    lastImage = await resizeImage(file);
  } catch {
    errorMessage.value = "Something went wrong. Please try again.";
    step.value = "error";
    return;
  }
  await analyze(false);
}

/** Sends the photo to the backend. force = true is the "Add anyway" case for duplicate receipts. */
async function analyze(force: boolean) {
  if (!lastImage) return;
  step.value = "analyzing";
  duplicate.value = false;
  try {
    const analysis = await analyzeReceipt(lastImage, force);
    // The app only knows Fridge / Freezer / Pantry – "Room Temperature" from the AI becomes Pantry
    items.value = analysis.items.map((i) =>
      i.suggestedStoragePlace === 'Room Temperature' ? { ...i, suggestedStoragePlace: 'Pantry' } : i,
    );
    reference.value = {
      date: analysis.referenceDate,
      source: analysis.referenceDateSource,
    };
    fileHash.value = analysis.fileHash ?? null;
    step.value = "review";
  } catch (e) {
    duplicate.value = e instanceof DuplicateReceiptError;
    errorMessage.value =
      e instanceof ScanError
        ? e.message
        : "Something went wrong. Please try again.";
    step.value = "error";
  }
}

// ----- Review list -----
function removeItem(index: number) {
  items.value.splice(index, 1);
}

function addEmptyItem() {
  items.value.push({
    name: "",
    unreadable: true,
    quantity: 1,
    category: "other",
    suggestedStoragePlace: null,
    storageNote: null,
    expirationDate: null,
    expirationDateEstimated: false,
    estimationNote: null,
  });
}

/** Items that still need a name or storage place */
const openIssues = computed(
  () =>
    items.value.filter(
      (i) =>
        !i.name.trim() ||
        i.name === "Unreadable item" ||
        !i.suggestedStoragePlace,
    ).length,
);

async function confirm() {
  saving.value = true;
  saveError.value = "";
  const error = await addItems(
    items.value.map((i) => ({
      name: i.name.trim(),
      quantity: i.quantity,
      category: i.category,
      suggestedStoragePlace: i.suggestedStoragePlace as StoragePlace,
      expirationDate: i.expirationDate,
      expirationDateEstimated: i.expirationDateEstimated,
      weightKg: i.weightKg ?? null, // from the receipt – used by the Impact tab
      price: i.price ?? null,
    })),
    reference.value.date,
    reference.value.source,
    fileHash.value,
  );
  saving.value = false;
  if (error) saveError.value = error;
  else router.push("/pantry");
}
</script>

<template>
  <header class="bar">
    <button class="back" aria-label="Back" @click="router.back()">
      <ChevronLeft :size="24" />
    </button>
    <h1>
      {{ step === "review" ? "Check your items" : "Scan groceries" }}
    </h1>
  </header>

  <input
    ref="cameraInput"
    type="file"
    accept="image/*"
    capture="environment"
    hidden
    @change="onFileChosen" />
  <input
    ref="galleryInput"
    type="file"
    accept="image/*"
    hidden
    @change="onFileChosen" />

  <main class="page">
    <!-- 1. Start -->
    <section v-if="step === 'start'" class="start">
      <div class="hero">
        <ScanIcon :size="64" :stroke-width="1.25" />
        <p class="hero-title">Snap a receipt or your groceries</p>
        <p class="hero-text">
          Our AI reads every item, picks the right storage place and
          estimates how long it stays fresh.
        </p>
      </div>
      <button class="btn-primary" @click="cameraInput?.click()">
        <Camera :size="20" :stroke-width="1.75" /> Take photo
      </button>
      <button class="btn-secondary" @click="galleryInput?.click()">
        <ImageUp :size="20" :stroke-width="1.75" /> Choose from
        library
      </button>
      <ul class="tips">
        <li>Receipt: lay it flat and fully visible</li>
        <li>Groceries: spread them out, labels facing up</li>
        <li>Use good light</li>
        <li>Your photo is never stored</li>
      </ul>
    </section>

    <!-- 2. Waiting for the AI -->
    <section v-else-if="step === 'analyzing'" class="center">
      <div class="spinner" />
      <p class="hero-title">Reading your photo…</p>
      <p class="hero-text">This takes a few seconds.</p>
    </section>

    <!-- 3. Error -->
    <section v-else-if="step === 'error'" class="center">
      <p class="hero-title">
        {{ duplicate ? "Receipt already saved" : "That didn’t work" }}
      </p>
      <p class="hero-text">{{ errorMessage }}</p>
      <button
        v-if="duplicate"
        class="btn-primary"
        @click="analyze(true)">
        <Plus :size="18" /> Add anyway
      </button>
      <button
        :class="duplicate ? 'btn-secondary again' : 'btn-primary'"
        @click="step = 'start'">
        <RotateCcw :size="18" />
        {{ duplicate ? "Scan another receipt" : "Try again" }}
      </button>
    </section>

    <!-- 4. Review list -->
    <section v-else class="review-list">
      <p class="summary">
        We found <strong>{{ items.length }} items</strong>. Check
        them, then add them to your pantry.
      </p>
      <ReviewItem
        v-for="(item, i) in items"
        :key="i"
        v-model="items[i]"
        @remove="removeItem(i)" />
      <button class="add" @click="addEmptyItem">
        <Plus :size="18" /> Add an item
      </button>
    </section>
  </main>

  <!-- Confirm button sits above the tab bar -->
  <div v-if="step === 'review'" class="confirm-bar">
    <p v-if="saveError" class="issues">{{ saveError }}</p>
    <p v-if="openIssues" class="issues">
      {{ openIssues }} item{{ openIssues > 1 ? "s" : "" }} still
      need{{ openIssues > 1 ? "" : "s" }} a name or storage place
    </p>
    <button
      class="btn-primary"
      :disabled="openIssues > 0 || !items.length || saving"
      @click="confirm">
      {{ saving ? "Saving…" : `Add ${items.length} items to pantry` }}
    </button>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px 16px 12px;
}
.bar h1 {
  font-size: 22px;
  font-weight: 600;
}
.back {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: var(--color-text);
}

.page {
  padding: 0 var(--page-padding);
}

/* Start */
.start {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding: 32px 24px;
  border-radius: var(--radius-xl);
  background: var(--color-primary);
  color: var(--color-accent);
  text-align: center;
}
.hero .hero-title {
  color: var(--color-on-primary);
}
.hero .hero-text {
  color: var(--color-on-primary-muted);
}
.hero-title {
  font-size: 20px;
  font-weight: 600;
}
.hero-text {
  font-size: 14px;
  color: var(--color-text-muted);
}
.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-tile);
  color: var(--color-primary);
  font-size: 15px;
  font-weight: 600;
}
.tips {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--color-text-muted);
}

/* Waiting + error */
.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 60px 12px;
  text-align: center;
}
.center .btn-primary {
  margin-top: 12px;
}
.center .again {
  width: 100%;
  max-width: 320px;
}
.spinner {
  width: 44px;
  height: 44px;
  margin-bottom: 8px;
  border: 4px solid var(--color-tile);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Review */
.review-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 110px;
}
.summary {
  margin-bottom: 4px;
  font-size: 14px;
  color: var(--color-text-muted);
}
.summary strong {
  color: var(--color-text);
}
.add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  border: 1px dashed var(--color-primary);
  border-radius: var(--radius-md);
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 600;
}
.confirm-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(76px + env(safe-area-inset-bottom));
  padding: 12px var(--page-padding);
  background: linear-gradient(
    to top,
    var(--color-bg) 75%,
    transparent
  );
}
.confirm-bar .btn-primary {
  max-width: 472px;
  margin: 0 auto;
}
.btn-primary:disabled {
  opacity: 0.45;
}
.issues {
  margin-bottom: 8px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--fresh-red-text);
}
</style>
