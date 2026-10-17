<template>
  <div class="suc-page">
    <div class="suc-content">
      <div class="title-box">
        <img src="/imgs/icons/success.webp" class="success-img" />
        <div class="title-msg" v-safe-html="successText"></div>
      </div>

      <!-- ------------------------------------------------------------------
        抽奖转盘预览。
        答题端真实实现在 render/pages/SuccessPage.vue；这里用同一份 luckDraw 规则
        （概率、配色、停靠角度）就地渲染，作者配完不用发布就能看到效果。
      ------------------------------------------------------------------ -->
      <div v-if="luckEnabled && prizes.length >= 2" class="pk-lucky">
        <p class="pk-lucky__title">{{ luckTitle }}</p>
        <div class="pk-lucky__stage">
          <span class="pk-lucky__pointer" aria-hidden="true"></span>
          <div class="pk-lucky__wheel">
            <div
              class="pk-lucky__disc"
              :style="{
                background: wheelGradient,
                transform: `rotate(${rotation}deg)`,
                transitionDuration: spinning ? `${spinMs}ms` : '0ms'
              }"
            >
              <span
                v-for="(prize, index) in prizes"
                :key="index"
                class="pk-lucky__label"
                :style="{ '--mid': `${midAngle(index)}deg` }"
              >
                <span class="pk-lucky__label-inner">
                  <img
                    v-if="isImageIcon(prize.icon)"
                    class="pk-lucky__icon"
                    :src="prize.icon"
                    alt=""
                  />
                  <em v-else class="pk-lucky__emoji">{{ prize.icon || '🎁' }}</em>
                  <b class="pk-lucky__name">{{ prize.name }}</b>
                </span>
              </span>
            </div>
            <button class="pk-lucky__go" type="button" :disabled="spinning" @click="spin">
              {{ spinning ? '···' : '试转一下' }}
            </button>
          </div>
        </div>
        <p v-if="drawnPrize" class="pk-lucky__result">抽中：{{ drawnPrize.name }}</p>
        <p class="pk-lucky__hint">仅预览，不会记录到访客的抽奖记录</p>
      </div>

      <!-- 自动跳转预览 -->
      <div v-if="jumpUrl" class="pk-jump">
        <p class="pk-jump__tip">提交后 {{ jumpDelay }} 秒自动前往 {{ jumpHost }}</p>
        <span class="pk-jump__btn">立即前往（预览不跳转）</span>
      </div>

      <div class="bottom-btn"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  isImageIcon,
  normalizePrizes,
  pickPrizeIndex,
  type LuckPrize
} from '@/common/luckDraw'
import { safeJumpUrl } from '@/common/safeLink'

interface Props {
  moduleConfig: any
}
const props = defineProps<Props>()
const successText = computed(() => props.moduleConfig?.msgContent?.msg_200 || '')

/* ============================ 抽奖转盘 ============================ */
const spinMs = 2600

const luckConf = computed<any>(() => props.moduleConfig?.luckDrawConf || {})
const luckEnabled = computed(() => Boolean(luckConf.value?.enable))
const prizes = computed<LuckPrize[]>(() => normalizePrizes(luckConf.value?.prizes))
const luckTitle = computed(() => luckConf.value?.title || '恭喜你完成问卷！转动转盘试试手气吧')
const step = computed(() => 360 / Math.max(1, prizes.value.length))

// 与答题端同一套 pjsk 柔和扇形配色
const palette = ['#d6faf5', '#ffe4f1', '#fff6cc', '#e2ecff', '#efe2ff', '#ddf7e6']
const wheelGradient = computed(() => {
  const stops = prizes.value.map(
    (_, index) =>
      `${palette[index % palette.length]} ${index * step.value}deg ${(index + 1) * step.value}deg`
  )
  return `conic-gradient(from 0deg, ${stops.join(', ')})`
})
const midAngle = (index: number) => index * step.value + step.value / 2

const rotation = ref(0)
const spinning = ref(false)
const drawnPrize = ref<LuckPrize | null>(null)

const spin = () => {
  if (spinning.value || prizes.value.length < 2) return
  spinning.value = true

  const index = pickPrizeIndex(prizes.value, Math.random)
  const current = ((rotation.value % 360) + 360) % 360
  const mid = midAngle(index)
  const delta = (((360 - mid - current) % 360) + 360) % 360
  const jitter = (Math.random() - 0.5) * step.value * 0.6
  rotation.value = rotation.value + 360 * 3 + delta + jitter

  window.setTimeout(() => {
    spinning.value = false
    drawnPrize.value = prizes.value[index]
  }, spinMs + 120)
}

/* ============================ 自动跳转 ============================ */
const linkConf = computed<any>(() => props.moduleConfig?.linkConf || {})
const jumpUrl = computed(() => (linkConf.value?.enable ? safeJumpUrl(linkConf.value?.url) : ''))
const jumpDelay = computed(() => {
  const value = Number(linkConf.value?.delay ?? 5)
  if (Number.isNaN(value)) return 5
  return Math.max(0, Math.min(120, value))
})
const jumpHost = computed(() => {
  const url = jumpUrl.value
  if (!url) return ''
  const match = /^(?:https?:)?\/\/([^/]+)/i.exec(url)
  return match ? match[1] : '目标页面'
})
</script>
<style lang="scss" scoped>
/*成功页面跳转全屏展示浮层*/
.suc-page {
  padding: 0;
  text-align: center;
  width: 100%;
  display: inline-block;
  height: 100%;
  .success-img {
    margin-top: -0.2rem;
    width: 100px;
  }
}

.suc-content {
  max-width: 920px;
  margin: 0 auto;
  height: 100%;
  width: 100%;
  position: relative;
  padding-top: 1.8rem;
}

.title-msg {
  margin-top: 0.4rem;
  margin-bottom: 0.4rem;
  font-size: 0.36rem;
  color: #666;
  :deep(*) {
    font-size: 0.36rem;
  }
}
.bottom-btn {
  height: 60px;
}

/* ============================ 抽奖转盘（预览） ============================ */
$ink: #444466;

.pk-lucky {
  margin-top: 14px;

  &__title {
    font-size: 15px;
    font-weight: 700;
    color: $ink;
    margin-bottom: 12px;
  }

  &__stage {
    position: relative;
    width: 240px;
    height: 240px;
    margin: 0 auto;
    display: grid;
    place-items: center;
  }

  &__pointer {
    position: absolute;
    top: -3px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 18px solid #ff5599;
  }

  &__wheel {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 6px solid #fff;
    background: #fff;
    display: grid;
    place-items: center;
    box-shadow: 0 0 14px rgba(68, 68, 102, 0.26),
      inset 0 0 0 2px rgba(68, 68, 102, 0.05);
  }

  &__disc {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    overflow: hidden;
    transform: rotate(0deg);
    transition-property: transform;
    transition-timing-function: cubic-bezier(0.16, 0.72, 0.16, 1);
    will-change: transform;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: repeating-conic-gradient(
        from 0deg,
        rgba(255, 255, 255, 0.95) 0 0.9deg,
        transparent 0.9deg 45deg
      );
      pointer-events: none;
    }
  }

  &__label {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    transform-origin: 50% 50%;
    transform: rotate(var(--mid, 0deg));
    pointer-events: none;
  }

  &__label-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 1px;
    padding-top: 14px;
    width: 70px;
    transform: rotate(calc(-1 * var(--mid, 0deg)));
  }

  &__emoji {
    font-size: 20px;
    line-height: 1;
    font-style: normal;
  }

  &__icon {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }

  &__name {
    font-size: 11px;
    font-weight: 700;
    color: $ink;
    line-height: 1.15;
    word-break: break-all;
    text-align: center;
  }

  &__go {
    position: relative;
    z-index: 4;
    width: 72px;
    height: 72px;
    border: 4px solid #fff;
    border-radius: 50%;
    background: var(--primary-color, #77eedd);
    color: $ink;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(68, 68, 102, 0.32);
    transition: transform 0.16s ease, filter 0.16s ease;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      filter: brightness(1.04);
    }

    &:disabled {
      cursor: default;
      filter: grayscale(0.35);
      opacity: 0.85;
    }
  }

  &__result {
    margin-top: 12px;
    font-size: 14px;
    font-weight: 700;
    color: #ff5599;
  }

  &__hint {
    margin-top: 4px;
    font-size: 12px;
    color: #a0a3b8;
  }
}

/* ============================ 自动跳转（预览） ============================ */
.pk-jump {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  &__tip {
    font-size: 13px;
    color: #6e707c;
  }

  &__btn {
    display: inline-block;
    padding: 6px 22px;
    border: 1.5px solid var(--primary-color, #77eedd);
    border-radius: 999px;
    background: #fff;
    color: #2fa596;
    font-size: 13px;
    font-weight: 700;
  }
}
</style>
