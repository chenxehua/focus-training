<template>
  <view class="radar-chart">
    <canvas
      canvas-id="radarCanvas"
      class="canvas"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    ></canvas>
    <view class="legend">
      <view
        v-for="(label, index) in labels"
        :key="index"
        class="legend-item"
      >
        <view class="legend-color" :style="{ background: colors[index % colors.length] }"></view>
        <text class="legend-label">{{ label }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'RadarChart',
  props: {
    labels: {
      type: Array,
      default: () => [
        '持续注意', '选择性注意', '分配注意', 
        '转移注意', '工作记忆', '冲动控制', '反应速度'
      ]
    },
    data: {
      type: Array,
      default: () => [0.8, 0.6, 0.7, 0.5, 0.75, 0.6, 0.85]
    },
    size: {
      type: Number,
      default: 280
    },
    colors: {
      type: Array,
      default: () => ['#6C63FF', '#FFD93D', '#FF6B6B', '#4ECDC4', '#45B7D1']
    }
  },
  data() {
    return {
      canvasWidth: 0,
      canvasHeight: 0,
      ctx: null,
      animationProgress: 0,
      animationTimer: null
    }
  },
  mounted() {
    this.initCanvas()
  },
  beforeDestroy() {
    if (this.animationTimer) {
      clearAnimationFrame(this.animationTimer)
    }
  },
  methods: {
    initCanvas() {
      const query = uni.createSelectorQuery().in(this)
      query.select('.canvas')
        .fields({ node: true, size: true })
        .exec(res => {
          if (res[0]) {
            const canvas = res[0].node
            const dpr = uni.getSystemInfoSync().pixelRatio || 2
            canvas.width = this.size * dpr
            canvas.height = this.size * dpr
            
            this.canvasWidth = this.size
            this.canvasHeight = this.size
            
            this.ctx = canvas.getContext('2d')
            this.ctx.scale(dpr, dpr)
            
            this.animateDraw()
          }
        })
    },
    animateDraw() {
      this.animationProgress = 0
      const animate = () => {
        if (this.animationProgress < 1) {
          this.animationProgress += 0.02
          this.draw()
          this.animationTimer = requestAnimationFrame(animate)
        } else {
          this.draw()
        }
      }
      animate()
    },
    draw() {
      if (!this.ctx) return
      
      const ctx = this.ctx
      const centerX = this.size / 2
      const centerY = this.size / 2
      const radius = this.size * 0.35
      const sides = this.labels.length
      const angle = (2 * Math.PI) / sides
      const startAngle = -Math.PI / 2

      ctx.clearRect(0, 0, this.size, this.size)

      // Draw background grid
      ctx.strokeStyle = '#E8E8E8'
      ctx.lineWidth = 1
      
      const levels = 5
      for (let i = 1; i <= levels; i++) {
        const levelRadius = (radius * i) / levels
        ctx.beginPath()
        for (let j = 0; j <= sides; j++) {
          const x = centerX + levelRadius * Math.cos(startAngle + angle * j - Math.PI / 2)
          const y = centerY + levelRadius * Math.sin(startAngle + angle * j - Math.PI / 2)
          if (j === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()
        ctx.stroke()
      }

      // Draw axis lines
      ctx.strokeStyle = '#CCCCCC'
      for (let i = 0; i < sides; i++) {
        const x = centerX + radius * Math.cos(startAngle + angle * i - Math.PI / 2)
        const y = centerY + radius * Math.sin(startAngle + angle * i - Math.PI / 2)
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(x, y)
        ctx.stroke()
      }

      // Draw labels
      ctx.fillStyle = '#666666'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      for (let i = 0; i < sides; i++) {
        const labelRadius = radius + 30
        const x = centerX + labelRadius * Math.cos(startAngle + angle * i - Math.PI / 2)
        const y = centerY + labelRadius * Math.sin(startAngle + angle * i - Math.PI / 2)
        ctx.fillText(this.labels[i], x, y)
        
        // Draw value
        const value = this.data[i] || 0
        const valueRadius = radius * Math.min(this.animationProgress * 1.2, 1)
        const valueX = centerX + valueRadius * value * Math.cos(startAngle + angle * i - Math.PI / 2)
        const valueY = centerY + valueRadius * value * Math.sin(startAngle + angle * i - Math.PI / 2)
        
        ctx.fillStyle = '#6C63FF'
        ctx.beginPath()
        ctx.arc(valueX, valueY, 4, 0, 2 * Math.PI)
        ctx.fill()
      }

      // Draw data polygon
      ctx.beginPath()
      for (let i = 0; i < sides; i++) {
        const value = this.data[i] || 0
        const valueRadius = radius * Math.min(this.animationProgress * 1.2, 1)
        const x = centerX + valueRadius * value * Math.cos(startAngle + angle * i - Math.PI / 2)
        const y = centerY + valueRadius * value * Math.sin(startAngle + angle * i - Math.PI / 2)
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      
      // Fill with gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, 'rgba(108, 99, 255, 0.4)')
      gradient.addColorStop(1, 'rgba(108, 99, 255, 0.1)')
      ctx.fillStyle = gradient
      ctx.fill()
      
      // Stroke the polygon
      ctx.strokeStyle = '#6C63FF'
      ctx.lineWidth = 2
      ctx.stroke()
    },
    handleTouchStart(e) {},
    handleTouchMove(e) {},
    handleTouchEnd(e) {}
  }
}
</script>

<style scoped>
.radar-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
}

.canvas {
  background: #FFFFFF;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 20rpx;
  gap: 16rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 16rpx;
}

.legend-color {
  width: 24rpx;
  height: 24rpx;
  border-radius: 4rpx;
  margin-right: 8rpx;
}

.legend-label {
  font-size: 24rpx;
  color: #666666;
}
</style>