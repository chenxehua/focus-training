<template>
  <view class="child-selector">
    <view class="current-child" @click="toggleDropdown">
      <image class="avatar" :src="currentChild.avatar || defaultAvatar" mode="aspectFill" />
      <view class="info">
        <text class="name">{{ currentChild.name }}</text>
        <text class="age">{{ currentChild.age }}岁</text>
      </view>
      <view class="arrow" :class="{ 'arrow-up': showDropdown }">
        <text class="icon">▼</text>
      </view>
    </view>

    <view v-if="showDropdown" class="dropdown">
      <view
        v-for="child in children"
        :key="child.id"
        class="dropdown-item"
        :class="{ active: child.id === currentChild.id }"
        @click="selectChild(child)"
      >
        <image class="avatar-small" :src="child.avatar || defaultAvatar" mode="aspectFill" />
        <view class="info-small">
          <text class="name">{{ child.name }}</text>
          <text class="age">{{ child.age }}岁</text>
        </view>
        <view v-if="child.id === currentChild.id" class="check">
          <text>✓</text>
        </view>
      </view>

      <view class="dropdown-divider" v-if="children.length > 1"></view>
      <view class="dropdown-item add-child" @click="goToAddChild">
        <view class="add-icon">+</view>
        <text class="add-text">添加孩子</text>
      </view>
    </view>

    <view v-if="showDropdown" class="overlay" @click="toggleDropdown"></view>
  </view>
</template>

<script>
export default {
  name: 'ChildSelector',
  props: {
    children: {
      type: Array,
      default: () => []
    },
    currentChildId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      showDropdown: false,
      defaultAvatar: '/static/images/default-avatar.png'
    }
  },
  computed: {
    currentChild() {
      const child = this.children.find(c => c.id === this.currentChildId)
      return child || {
        id: '',
        name: '请选择孩子',
        age: 0,
        avatar: ''
      }
    }
  },
  methods: {
    toggleDropdown() {
      this.showDropdown = !this.showDropdown
    },
    selectChild(child) {
      this.$emit('change', child)
      this.showDropdown = false
    },
    goToAddChild() {
      this.showDropdown = false
      uni.navigateTo({
        url: '/pages/children/add'
      })
    }
  }
}
</script>

<style scoped>
.child-selector {
  position: relative;
  z-index: 100;
}

.current-child {
  display: flex;
  align-items: center;
  padding: 12rpx 24rpx;
  background: #FFFFFF;
  border-radius: 40rpx;
  box-shadow: 0 2rpx 12rpx rgba(108, 99, 255, 0.15);
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.info {
  display: flex;
  flex-direction: column;
}

.name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.age {
  font-size: 22rpx;
  color: #999999;
}

.arrow {
  margin-left: 16rpx;
  transition: transform 0.2s;
}

.arrow-up {
  transform: rotate(180deg);
}

.icon {
  font-size: 20rpx;
  color: #6C63FF;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 12rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 101;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item.active {
  background: #F8F6FF;
}

.avatar-small {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.info-small {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-small .name {
  font-size: 26rpx;
}

.info-small .age {
  font-size: 20rpx;
}

.check {
  width: 40rpx;
  height: 40rpx;
  background: #6C63FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 24rpx;
}

.dropdown-divider {
  height: 1rpx;
  background: #F5F5F5;
}

.add-child {
  justify-content: center;
  background: #FAFAFA;
}

.add-icon {
  width: 48rpx;
  height: 48rpx;
  background: #6C63FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 16rpx;
}

.add-text {
  font-size: 26rpx;
  color: #6C63FF;
  font-weight: 500;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}
</style>