import ADMIN from '../pages/admin.jsx';
import ACTIVITY_MANAGEMENT from '../pages/activity-management.jsx';
import DATA_EXPORT from '../pages/data-export.jsx';
import LOGIN from '../pages/login.jsx';
import ORDER_MANAGEMENT from '../pages/order-management.jsx';
import USER_STATISTICS from '../pages/user-statistics.jsx';
export const routers = [{
  id: "admin",
  component: ADMIN
}, {
  id: "activity-management",
  component: ACTIVITY_MANAGEMENT
}, {
  id: "data-export",
  component: DATA_EXPORT
}, {
  id: "login",
  component: LOGIN
}, {
  id: "order-management",
  component: ORDER_MANAGEMENT
}, {
  id: "user-statistics",
  component: USER_STATISTICS
}]