'use client'

import { UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Package, Plus } from 'lucide-react'

export default function CustomUserButton() {
  const router = useRouter()

  return (
    <UserButton
      appearance={{
        elements: {
          userButtonPopoverActionButton__manageAccount: {
            display: 'none',
          },
        },
      }}
    >
      <UserButton.MenuItems>
        <UserButton.Action
          label="Dashboard"
          labelIcon={<Package className="h-4 w-4" />}
          onClick={() => router.push('/account')}
        />
        <UserButton.Action
          label="Index Product"
          labelIcon={<Plus className="h-4 w-4" />}
          onClick={() => router.push('/account/products/new')}
        />
      </UserButton.MenuItems>
    </UserButton>
  )
}
