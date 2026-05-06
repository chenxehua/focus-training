import { post, get } from './request'

export interface MembershipInfo {
  id: number
  member_type: 'month' | 'quarter' | 'year' | 'lifetime'
  member_name: string
  start_date: string
  end_date?: string
  status: 'active' | 'expired' | 'cancelled'
  features: string[]
  is_vip: boolean
}

export interface MembershipStatus {
  is_vip: boolean
  member_type: string | null
  member_level: string | null
  start_date: string | null
  end_date: string | null
  days_remaining: number
}

export interface OrderInfo {
  orderId: string
  amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  createdAt: string
}

export interface CreateOrderParams {
  memberType: 'month' | 'quarter' | 'year' | 'lifetime'
}

/**
 * 获取当前用户会员信息
 */
export function getMembershipInfo() {
  return get<MembershipInfo>('/api/membership/info')
}

/**
 * 创建会员订单
 */
export function createMembershipOrder(params: CreateOrderParams) {
  return post<OrderInfo>('/api/membership/order', params)
}

/**
 * 获取订单列表
 */
export function getOrderList(page: number = 1, pageSize: number = 10) {
  return get<{
    list: OrderInfo[]
    total: number
    page: number
    pageSize: number
  }>('/api/membership/orders', { page, pageSize })
}

/**
 * 获取订单详情
 */
export function getOrderDetail(orderId: string) {
  return get<OrderInfo>(`/api/membership/order/${orderId}`)
}

/**
 * 微信支付统一下单
 */
export function wechatPay(orderId: string) {
  return post<{
    orderId: string
    paymentParams: {
      timeStamp: string
      nonceStr: string
      package: string
      signType: string
      paySign: string
    }
  }>(`/api/payment/wechat`, { orderId })
}

/**
 * 支付结果查询
 */
export function queryPaymentResult(orderId: string) {
  return get<{ status: 'pending' | 'paid' | 'failed'; message: string }>(`/api/payment/result/${orderId}`)
}

/**
 * 获取会员权益说明
 */
export function getMembershipBenefits() {
  return get<{
    tiers: Array<{
      type: string
      name: string
      price: number
      originalPrice?: number
      period: string
      features: string[]
    }>
  }>('/api/membership/benefits')
}

/**
 * 获取会员状态
 */
export function getMembershipStatus() {
  return get<MembershipStatus>('/api/membership/status')
}