<template>
  <div class="result-page-wrap">
    <div class="result-page">
      <div class="result-content">
        <img src="/imgs/icons/success.webp" />
        <!-- 考试模式：展示本次得分（服务端判分，刷新即失效） -->
        <div v-if="examResult" class="exam-card">
          <div class="exam-card__label">本次得分</div>
          <div class="exam-card__score">
            <span class="num">{{ examResult.score }}</span>
            <span class="full">/ {{ examResult.fullScore }}</span>
          </div>
          <div class="exam-card__meta">
            答对 {{ examResult.correctCount }} / {{ examResult.gradedCount }} 题
            · 正确率 {{ examResult.accuracy }}%
          </div>
          <div v-if="passLine > 0" class="exam-card__pass" :class="{ 'is-pass': isPass }">
            {{ isPass ? '已及格' : '未及格' }}
          </div>
        </div>
        <div class="msg" v-html="successMsg"></div>

        <!-- ================= 抽奖转盘（作者在「结果页 → 抽奖转盘」里配置） ================= -->
        <div v-if="luckEnabled && luckPrizes.length >= 2" class="lucky">
          <p class="lucky__title">{{ luckTitle }}</p>

          <div class="lucky__stage">
            <span class="lucky__pointer" aria-hidden="true"></span>
            <div
              class="lucky__wheel"
              :style="{
                background: wheelGradient,
                transform: `rotate(${rotation}deg)`,
                transitionDuration: spinAnimating ? `${spinMs}ms` : '0ms',
                '--lucky-step': `${step}deg`
              }"
            >
              <span
                v-for="(prize, index) in luckPrizes"
                :key="index"
                class="lucky__label"
                :style="{ transform: `rotate(${midAngle(index)}deg)` }"
              >
                <span class="lucky__label-inner">
                  <img v-if="isImageIcon(prize.icon)" class="lucky__label-icon" :src="prize.icon" alt="" />
                  <em v-else class="lucky__label-emoji">{{ prize.icon || '🎁' }}</em>
                  <b class="lucky__label-name">{{ prize.name }}</b>
                </span>
              </span>

              <button
                class="lucky__go"
                type="button"
                :disabled="spinning || luckyDone"
                @click="spin"
              >
                {{ luckyDone ? '已抽过' : spinning ? '···' : '抽奖' }}
              </button>
            </div>
          </div>

          <transition name="lucky-pop">
            <div v-if="drawnPrize" class="lucky__result">
              <span class="lucky__result-label">{{ luckyDoneFresh ? '恭喜抽中' : '本次结果' }}</span>
              <img
                v-if="isImageIcon(drawnPrize.icon)"
                class="lucky__result-icon"
                :src="drawnPrize.icon"
                alt=""
              />
              <em v-else class="lucky__result-emoji">{{ drawnPrize.icon || '🎁' }}</em>
              <b class="lucky__result-name">{{ drawnPrize.name }}</b>
            </div>
          </transition>
          <p v-if="luckyDone && !luckyDoneFresh" class="lucky__tip">同一份作答只能抽一次哦</p>
        </div>

        <!-- ================= 自动跳转（作者在「结果页 → 自动跳转」里配置） ================= -->
        <div v-if="jumpUrl && !jumpBlockedByLuck" class="jump">
          <p v-if="jumpCountdown > 0" class="jump__tip">
            <b>{{ jumpCountdown }}</b> 秒后自动前往 {{ jumpHost }}
          </p>
          <p v-else class="jump__tip">正在前往 {{ jumpHost }} …</p>
          <button class="jump__btn" type="button" @click="jumpNow">立即前往</button>
        </div>
        <p v-else-if="jumpBlockedByLuck" class="jump__waiting">抽完奖再带你去下一个页面～</p>

        <router-link
          :to="{
            name: 'renderPage',
            query: {
              t: new Date().getTime()
            }
          }"
          replace
          class="reset-link"
        >
          重新填写
        </router-link>
      </div>
      <LogoIcon :logo-conf="logoConf" :readonly="true" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useSurveyStore } from '../stores/survey'
import {
  isImageIcon,
  normalizePrizes,
  pickPrizeIndex,
  prizeProbabilities,
  readLuckDrawRecord,
  saveLuckDrawRecord,
  type LuckPrize
} from '@/common/luckDraw'
import { safeJumpUrl } from '@/common/safeLink'
// @ts-ignore
import communalLoader from '@materials/communals/communalLoader.js'

const LogoIcon = communalLoader.loadComponent('LogoIcon')
const surveyStore = useSurveyStore()

const logoConf = computed(() => {
  return surveyStore?.bottomConf || {}
})
const submitConf = computed<any>(() => (surveyStore?.submitConf as any) || {})
const successMsg = computed(() => {
  const msgContent = submitConf.value?.msgContent || {}
  return msgContent?.msg_200 || '提交成功'
})

// 考试模式：得分与及格线
const examResult = computed(() => (surveyStore as any)?.examResult || null)
const passLine = computed(
  () => Number((surveyStore as any)?.baseConf?.examPassScore) || 0
)
const isPass = computed(
  () => Boolean(examResult.value) && examResult.value.score >= passLine.value
)

/* ============================ 抽奖转盘 ============================ */
const spinMs = 4200

const luckConf = computed<any>(() => submitConf.value?.luckDrawConf || {})
const luckEnabled = computed(() => Boolean(luckConf.value?.enable))
const luckPrizes = computed<LuckPrize[]>(() => normalizePrizes(luckConf.value?.prizes))
const luckTitle = computed(() => luckConf.value?.title || '恭喜你完成问卷！转动转盘试试手气吧')
const probabilities = computed(() => prizeProbabilities(luckPrizes.value))
const step = computed(() => 360 / Math.max(1, luckPrizes.value.length))

// 三色柔和扇形，相邻不撞色（奇偶交替 + 奇数个时最后一块换色）
const wheelGradient = computed(() => {
  const palette = ['#d6faf5', '#ffe4f1', '#fff3cc']
  const total = luckPrizes.value.length
  const stops = luckPrizes.value.map((_, index) => {
    let colorIndex = index % 2
    if (total % 2 === 1 && index === total - 1) colorIndex = 2
    return `${palette[colorIndex]} ${index * step.value}deg ${(index + 1) * step.value}deg`
  })
  return `conic-gradient(from 0deg, ${stops.join(', ')})`
})

const rotation = ref(0)
const spinning = ref(false)
// 只有真正开转时才上过渡动画；否则"恢复上次结果"时的定位会变成慢慢转 5 圈
const spinAnimating = ref(false)
const drawnPrize = ref<LuckPrize | null>(null)
const luckyDoneFresh = ref(false) // true = 本次刚抽出来的，false = 之前抽过（存 localStorage）

const surveyPath = computed(() => String((surveyStore as any)?.surveyPath || ''))
const luckyDone = computed(() => Boolean(drawnPrize.value))

const midAngle = (index: number) => index * step.value + step.value / 2

const spin = () => {
  if (spinning.value || luckyDone.value || luckPrizes.value.length < 2) return
  spinning.value = true
  spinAnimating.value = true

  const index = pickPrizeIndex(luckPrizes.value, Math.random)
  // 让该扇区中心停到指针（正上方）下面：
  // 转盘顺时针转 R 后，原本在 mid 的扇区会落到 mid + R，要求 mid + R ≡ 0 (mod 360)
  const current = ((rotation.value % 360) + 360) % 360
  const mid = midAngle(index)
  const delta = ((360 - mid - current) % 360 + 360) % 360
  // 抖一点，别每次都停在正中间
  const jitter = (Math.random() - 0.5) * step.value * 0.6
  rotation.value = rotation.value + 360 * 5 + delta + jitter

  window.setTimeout(() => {
    spinning.value = false
    spinAnimating.value = false
    drawnPrize.value = luckPrizes.value[index]
    luckyDoneFresh.value = true
    saveLuckDrawRecord(surveyPath.value, {
      name: drawnPrize.value.name,
      icon: drawnPrize.value.icon,
      time: Date.now()
    })
  }, spinMs + 120)
}

// 同一份作答只抽一次：进来先看本地记录
const restoreRecord = () => {
  if (!luckEnabled.value || !surveyPath.value) return
  const record = readLuckDrawRecord(surveyPath.value)
  if (record && !luckyDoneFresh.value) {
    drawnPrize.value = { name: record.name, icon: record.icon, rate: 0 }
    luckyDoneFresh.value = false
    // 已经抽过了，转盘停在对应扇区（视觉上别像没动过）
    const index = luckPrizes.value.findIndex((item) => item.name === record.name)
    if (index >= 0) rotation.value = 360 * 5 + ((360 - midAngle(index)) % 360)
  } else if (!record && !luckyDoneFresh.value) {
    drawnPrize.value = null
  }
}

/* ============================ 自动跳转 ============================ */
const linkConf = computed<any>(() => submitConf.value?.linkConf || {})
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
// 开了抽奖又还没抽，就先别把人带走
const jumpBlockedByLuck = computed(() => Boolean(jumpUrl.value) && luckEnabled.value && !luckyDone.value)
const jumpCountdown = ref(0)
let jumpTimer: number | null = null

const clearJumpTimer = () => {
  if (jumpTimer !== null) {
    window.clearInterval(jumpTimer)
    jumpTimer = null
  }
}

const jumpNow = () => {
  clearJumpTimer()
  const url = jumpUrl.value
  if (url) window.location.href = url
}

const startJump = () => {
  if (!jumpUrl.value || jumpBlockedByLuck.value) return
  clearJumpTimer()
  if (jumpDelay.value <= 0) {
    jumpNow()
    return
  }
  jumpCountdown.value = jumpDelay.value
  jumpTimer = window.setInterval(() => {
    jumpCountdown.value -= 1
    if (jumpCountdown.value <= 0) {
      clearJumpTimer()
      jumpNow()
    }
  }, 1000)
}

watch(
  () => [jumpUrl.value, jumpBlockedByLuck.value, luckEnabled.value],
  () => {
    restoreRecord()
    if (!jumpUrl.value || jumpBlockedByLuck.value) {
      clearJumpTimer()
      jumpCountdown.value = 0
      return
    }
    startJump()
  },
  { immediate: true }
)

onBeforeUnmount(clearJumpTimer)

// 给调试/测试用：把中奖概率吐到控制台，方便核对爆率配置
if (import.meta.env.DEV && typeof console !== 'undefined') {
  watch(
    () => luckPrizes.value,
    (list) => {
      if (!list.length) return
      const probs = probabilities.value
      console.debug(
        '[lucky] 奖项概率:',
        list.map((item, i) => `${item.name} ${(probs[i] * 100).toFixed(2)}%`).join('  |  ')
      )
    },
    { immediate: true }
  )
}
</script>
<style lang="scss" scoped>
@import '@/render/styles/variable.scss';

.result-page-wrap {
  width: 100%;
  flex: 1;
  text-align: center;
  /* 有转盘之后页面可能比一屏高，允许滚动 */
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--primary-background-color);

  padding: 0 0.3rem;
  .result-page {
    background: rgba(255, 255, 255, var(--opacity));
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

.result-content {
  position: relative;
  max-width: 920px;
  margin: 0 auto;
  height: 100%;
  width: 100%;
  position: relative;
  padding-top: 2rem;
  flex: 1;

  img {
    width: 2rem;
  }

  .msg {
    font-size: 0.32rem;
    color: #4a4c5b;
    letter-spacing: 0;
    text-align: center;
    font-weight: 500;
    margin-top: 0.15rem;
  }

  .exam-card {
    width: 5.6rem;
    margin: 0.36rem auto 0;
    padding: 0.32rem 0.24rem;
    border-radius: 0.32rem;
    background: #fff;
    box-shadow: 0 0 0.32rem rgba(68, 68, 102, 0.12);

    &__label {
      font-size: 0.26rem;
      color: #8a8aa8;
      letter-spacing: 0.04rem;
    }

    &__score {
      margin-top: 0.12rem;
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 0.12rem;

      .num {
        font-size: 1.1rem;
        font-weight: 800;
        line-height: 1.1;
        color: var(--primary-color, #77eedd);
        text-shadow: 0 0.04rem 0.12rem rgba(63, 208, 189, 0.35);
      }

      .full {
        font-size: 0.3rem;
        color: #8a8aa8;
      }
    }

    &__meta {
      margin-top: 0.16rem;
      font-size: 0.26rem;
      color: #6e707c;
    }

    &__pass {
      display: inline-block;
      margin-top: 0.2rem;
      padding: 0.06rem 0.24rem;
      border-radius: 0.3rem;
      font-size: 0.24rem;
      color: #ec4e29;
      background: #ffefeb;

      &.is-pass {
        color: #2fa596;
        background: #eafcf9;
      }
    }
  }

  .reset-link {
    margin-top: 0.24rem;
    font-size: 0.27rem;
    color: #5094f0;
    text-decoration: underline;
    display: block;
  }
}

/* ============================ 抽奖转盘 ============================ */
$ink: #444466;

.lucky {
  margin-top: 0.5rem;

  &__title {
    font-size: 0.3rem;
    font-weight: 800;
    color: $ink;
    margin-bottom: 0.28rem;
  }

  &__stage {
    position: relative;
    width: 4.6rem;
    height: 4.6rem;
    margin: 0 auto;
    display: grid;
    place-items: center;
  }

  &__pointer {
    position: absolute;
    top: -0.06rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 3;
    width: 0;
    height: 0;
    border-left: 0.2rem solid transparent;
    border-right: 0.2rem solid transparent;
    border-top: 0.36rem solid #ff5599;
    filter: drop-shadow(0 0.04rem 0.08rem rgba(68, 68, 102, 0.35));
  }

  &__wheel {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 0.14rem solid #fff;
    box-shadow: 0 0 0.24rem rgba(68, 68, 102, 0.28);
    transform: rotate(0deg);
    transition-property: transform;
    transition-timing-function: cubic-bezier(0.16, 0.72, 0.16, 1);
    will-change: transform;

    /* 每块之间的白色细缝 */
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: repeating-conic-gradient(
        from 0deg,
        rgba(255, 255, 255, 0.95) 0 0.9deg,
        transparent 0.9deg var(--lucky-step, 45deg)
      );
      pointer-events: none;
    }
  }

  &__label {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    transform-origin: 50% 50%;
    pointer-events: none;
  }

  &__label-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.04rem;
    padding-top: 0.3rem;
    width: 1.5rem;
  }

  &__label-emoji {
    font-size: 0.42rem;
    line-height: 1;
    font-style: normal;
  }

  &__label-icon {
    width: 0.44rem;
    height: 0.44rem;
    object-fit: contain;
  }

  &__label-name {
    font-size: 0.22rem;
    font-weight: 700;
    color: $ink;
    line-height: 1.15;
    word-break: break-all;
  }

  &__go {
    position: relative;
    z-index: 4;
    width: 1.5rem;
    height: 1.5rem;
    border: 0.08rem solid #fff;
    border-radius: 50%;
    background: var(--primary-color, #77eedd);
    color: $ink;
    font-size: 0.34rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 0 0.2rem rgba(68, 68, 102, 0.32);
    transition: transform 0.16s ease, filter 0.16s ease;

    &:hover:not(:disabled) {
      transform: translateY(-0.03rem);
      filter: brightness(1.04);
    }

    &:active:not(:disabled) {
      transform: none;
      background: #e3fcf8;
    }

    &:disabled {
      cursor: default;
      filter: grayscale(0.35);
      opacity: 0.85;
      font-size: 0.26rem;
    }
  }

  &__result {
    margin: 0.34rem auto 0;
    display: inline-flex;
    align-items: center;
    gap: 0.14rem;
    padding: 0.18rem 0.34rem;
    border-radius: 0.6rem;
    background: #fff;
    box-shadow: 0 0 0.2rem rgba(68, 68, 102, 0.18);
  }

  &__result-label {
    font-size: 0.24rem;
    color: #8a8aa8;
  }

  &__result-emoji {
    font-size: 0.44rem;
    font-style: normal;
    line-height: 1;
  }

  &__result-icon {
    width: 0.48rem;
    height: 0.48rem;
    object-fit: contain;
  }

  &__result-name {
    font-size: 0.34rem;
    font-weight: 800;
    color: #ff5599;
  }

  &__tip {
    margin-top: 0.16rem;
    font-size: 0.24rem;
    color: #8a8aa8;
  }
}

.lucky-pop-enter-active {
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.28s ease;
}
.lucky-pop-enter-from {
  transform: scale(0.6);
  opacity: 0;
}

/* ============================ 自动跳转 ============================ */
.jump {
  margin-top: 0.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.16rem;

  &__tip {
    font-size: 0.26rem;
    color: #6e707c;

    b {
      color: #ff5599;
      font-size: 0.32rem;
    }
  }

  &__btn {
    padding: 0.14rem 0.5rem;
    border: 0.03rem solid var(--primary-color, #77eedd);
    border-radius: 0.6rem;
    background: #fff;
    color: #2fa596;
    font-size: 0.26rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.16s ease;

    &:hover {
      background: #e3fcf8;
    }
  }

  &__waiting {
    margin-top: 0.3rem;
    font-size: 0.24rem;
    color: #8a8aa8;
  }
}
</style>
