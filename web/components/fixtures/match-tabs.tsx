import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
}

interface MatchTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function MatchTabs({ tabs, activeTab, onTabChange }: MatchTabsProps) {
  return (
    <div className="border-b">
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 min-w-[100px] px-4 py-3 text-sm font-medium transition-all",
              "border-b-2 hover:text-blue-600",
              activeTab === tab.id
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}