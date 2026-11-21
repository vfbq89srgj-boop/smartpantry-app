<!-- Bell in the header: unread badge + dropdown with the latest notifications (mock data, see data/notifications.ts) -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, CheckCheck } from '@lucide/vue'
import { markAllRead, markRead, notifications, unreadCount, whenLabel, type AppNotification } from '../data/notifications'

const router = useRouter()
const open = ref(false)

function openNotification(n: AppNotification) {
  markRead(n.id)
  open.value = false
  router.push(n.url)
}
</script>

<template>
  <div class="bell">
    <button class="icon-btn" aria-label="Notifications" :aria-expanded="open" @click="open = !open">
      <Bell :size="24" :stroke-width="1.75" />
      <span v-if="unreadCount" class="badge">{{ unreadCount }}</span>
    </button>

    <template v-if="open">
      <!-- invisible layer: a tap outside closes the dropdown -->
      <button class="backdrop" aria-label="Close notifications" @click="open = false" />
      <section class="panel" role="dialog" aria-label="Notifications">
        <div class="panel-head">
          <h2>Notifications</h2>
          <button v-if="unreadCount" class="read-all" @click="markAllRead">
            <CheckCheck :size="14" :stroke-width="2" /> Mark all read
          </button>
        </div>
        <p class="hint">Once a day: what expires within the next 7 days.</p>

        <ul v-if="notifications.length" class="list">
          <li v-for="n in notifications" :key="n.id">
            <button class="entry" :class="{ unread: !n.read }" @click="openNotification(n)">
              <span class="dot" aria-hidden="true" />
              <span class="text">
                <span class="title">{{ n.title }}</span>
                <span class="body">{{ n.body }}</span>
                <span class="when">{{ whenLabel(n.daysAgo) }}</span>
              </span>
            </button>
          </li>
        </ul>
        <p v-else class="empty">No notifications yet.</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.bell { position: relative; }
.icon-btn { position: relative; color: var(--color-text); padding: 4px; margin-right: -4px; }
.badge {
  position: absolute;
  top: -2px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--fresh-red-text);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}

.backdrop { position: fixed; inset: 0; z-index: 20; background: transparent; cursor: default; }
.panel {
  position: absolute;
  top: calc(100% + 8px);
  right: -4px;
  z-index: 21;
  width: min(340px, calc(100vw - 2 * var(--page-padding)));
  max-height: 70vh;
  overflow-y: auto;
  padding: 14px 14px 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 10px 30px rgb(24 62 50 / 0.18);
}
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.panel-head h2 { font-size: 16px; font-weight: 600; }
.read-all { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--color-primary); }
.hint { margin: 2px 0 8px; font-size: 12px; color: var(--color-text-muted); }

.list { list-style: none; margin: 0; padding: 0; }
.list li + li { border-top: 1px solid var(--color-border); }
.entry { display: flex; gap: 10px; width: 100%; padding: 10px 0; text-align: left; }
.dot { flex: 0 0 8px; height: 8px; margin-top: 6px; border-radius: 50%; background: transparent; }
.unread .dot { background: var(--color-primary); }
.text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.title { font-size: 14px; font-weight: 600; }
.body { font-size: 13px; color: var(--color-text-muted); }
.when { font-size: 11px; color: var(--color-text-muted); }
.empty { padding: 16px 0 12px; font-size: 14px; color: var(--color-text-muted); }
</style>
