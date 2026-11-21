<!-- Login screen – email + password, checked by Supabase -->
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import logo from "../assets/logo/pantryx-logo.svg";
import symbol from "../assets/logo/pantryx-zeichen.svg";
import { displayName, signIn } from "../data/auth";

const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);
const welcome = ref(false);

async function submit() {
  busy.value = true;
  error.value = "";
  const message = await signIn(email.value.trim(), password.value);
  busy.value = false;
  if (message) {
    error.value =
      message === "Invalid login credentials"
        ? "Wrong email or password."
        : message;
    return;
  }

  welcome.value = true;
  await new Promise((r) => setTimeout(r, 1800));
  router.replace("/");
}
</script>

<template>
  <main class="login">
    <div class="brand">
      <h1 class="logo"><img :src="logo" alt="PantryX" /></h1>
      <p>Waste less. Eat better.</p>
    </div>

    <form class="card form" @submit.prevent="submit">
      <label>
        <span>Email</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          autocapitalize="off"
          required />
      </label>
      <label>
        <span>Password</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn-primary" type="submit" :disabled="busy">
        {{ busy ? "Signing in…" : "Sign in" }}
      </button>
    </form>

    <Transition name="fade">
      <div v-if="welcome" class="welcome" role="status">
        <p class="welcome-text">
          <template v-if="displayName"
            >Hi, {{ displayName }}<span class="bang">!</span></template
          >
          <template v-else>Welcome to PantryX</template>
        </p>
        <img :src="symbol" alt="" class="welcome-logo" />
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 28px;
  min-height: 80vh;
  padding: 0 var(--page-padding);
}
.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}
.logo {
  margin-bottom: 4px;
  line-height: 0;
}
.logo img {
  display: block;
  width: min(250px, 70vw);
  height: auto;
}
.brand p {
  color: var(--color-text-muted);
}
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
}
input {
  height: 46px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
  font-size: 16px;
}
input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: -1px;
}
.error {
  font-size: 13px;
  font-weight: 500;
  color: var(--fresh-red-text);
}
.btn-primary {
  margin-top: 6px;
}
.btn-primary:disabled {
  opacity: 0.6;
}

/* Welcome overlay */
.welcome {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  background: var(--color-tile);
}
.welcome-text {
  /* Same rounded, heavy look as the logo lettering (Nunito ExtraBold; falls back to Inter until it is installed) */
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--color-brand);
  animation: rise 1s ease-out both;
}
/* The "!" in the green of the logo's "x" */
.bang {
  color: var(--color-brand-green);
}
.welcome-logo {
  width: 130px;
  height: 130px;
  animation: pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
}
.fade-enter-active {
  transition: opacity 0.35s ease;
}
.fade-enter-from {
  opacity: 0;
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .welcome-text,
  .welcome-logo {
    animation: none;
  }
}
</style>
