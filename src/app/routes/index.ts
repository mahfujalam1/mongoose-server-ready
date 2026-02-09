import { Router } from 'express';
import { UserRoutes } from '../modules/user/user-route';
import { AuthRoutes } from '../modules/auth/auth-route';
import { ManageRoutes } from '../modules/manage-web/manage.routes';
import { notificationRoutes } from '../modules/notification/notification.routes';
import { metaRoutes } from '../modules/meta/meta.routes';

const router = Router();

const moduleRoutes = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/manage-web',
    route: ManageRoutes,
  },
  {
    path: '/meta',
    route: metaRoutes,
  },
  {
    path: '/notification',
    route: notificationRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
