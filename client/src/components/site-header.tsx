'use client'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useBranchStore } from "@/lib/store/useBranchStore"
import { useUserStore } from "@/lib/store/useUserStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { IconSearch, IconCommand } from "@tabler/icons-react"

export function SiteHeader() {

  const {selectedBranch}=useBranchStore()
  const router = useRouter()

  // Global Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        router.push('/search')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Moumita Alankar ({selectedBranch?.name})</h1>
        <div className="ml-auto flex items-center gap-2">
          {/* Global Search Trigger */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/search')}
            className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground px-3"
          >
            <IconSearch size={16} />
            <span className="text-xs">Search</span>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted border border-border ml-1">
              <IconCommand size={10} />
              <span className="text-[10px] font-mono">K</span>
            </div>
          </Button>
        </div>
      </div>
    </header>
  )
}

