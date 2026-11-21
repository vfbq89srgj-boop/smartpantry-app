<!-- Login screen – email + password, checked by Supabase -->
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Leaf } from "@lucide/vue";
import { signIn } from "../data/auth";

const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);

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
  router.replace("/");
}
</script>

<template>
  <main class="login">
    <div class="brand">
      <div class="logo"><Leaf :size="34" :stroke-width="1.75" /></div>
      <h1>Pantrix</h1>
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
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  margin-bottom: 6px;
  border-radius: 20px;
  background: var(--color-primary);
  color: var(--color-accent);
}
.brand h1 {
  font-size: 30px;
  font-weight: 600;
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
</style>
