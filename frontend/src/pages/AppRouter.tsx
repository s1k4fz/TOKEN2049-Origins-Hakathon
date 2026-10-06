import { type RouteObject, useRoutes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { BountiesPage } from '@/pages/BountiesPage'
import { BountyPage } from '@/pages/BountyPage'
import { ClaimPage } from '@/pages/ClaimPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProtectGuidePage } from '@/pages/ProtectGuidePage'
import { SubmitPage } from '@/pages/SubmitPage'

const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      {
        // 提交页 -> 验证过程页，与后端 POST /api/claims、GET /api/claims/:id 同构。
        index: true,
        element: <SubmitPage />,
      },
      {
        path: 'claims/:id',
        element: <ClaimPage />,
      },
      {
        path: 'bounties',
        element: <BountiesPage />,
      },
      {
        path: 'bounties/:id',
        element: <BountyPage />,
      },
      {
        path: 'protect',
        element: <ProtectGuidePage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]

export function AppRouter() {
  return useRoutes(routes)
}
