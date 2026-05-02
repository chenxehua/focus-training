// Controller singleton instances
import { AuthController } from './authController'
import { GameController } from './gameController'
import { ReportController } from './reportController'
import { UserController } from './userController'
import { AchievementController } from './achievementController'
import { MembershipController } from './membershipController'
import { PaymentController } from './paymentController'
import { AssessmentController } from './assessmentController'

// Export singleton instances for routes and tests
export const authController = new AuthController()
export const gameController = new GameController()
export const reportController = new ReportController()
export const userController = new UserController()
export const achievementController = new AchievementController()
export const membershipController = new MembershipController()
export const paymentController = new PaymentController()
export const assessmentController = new AssessmentController()

// Also export classes for testing
export {
  AuthController,
  GameController,
  ReportController,
  UserController,
  AchievementController,
  MembershipController,
  PaymentController,
  AssessmentController,
}