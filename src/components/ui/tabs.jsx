import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = React.forwardRef(({ className, defaultValue, value, onValueChange, children, ...props }, ref) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue || value)

  const handleTabChange = (newValue) => {
    setActiveTab(newValue)
    onValueChange?.(newValue)
  }

  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value)
    }
  }, [value])

  // Filtrer les props qui ne doivent pas être passées au DOM
  const { defaultValue: _, value: __, onValueChange: ___, ...restProps } = props

  return (
    <div ref={ref} className={className} {...restProps}>
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child, { activeTab, onTabChange: handleTabChange })
          : child
      )}
    </div>
  )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef(({ className, children, activeTab, onTabChange, ...props }, ref) => {
  // Filtrer les props qui ne doivent pas être passées au DOM
  const { onTabChange: _, activeTab: __, ...restProps } = props
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...restProps}
    >
      {React.Children.map(children, child =>
        React.isValidElement(child) && child.type?.displayName === 'TabsTrigger'
          ? React.cloneElement(child, { activeTab, onTabChange })
          : child
      )}
    </div>
  )
})
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(({ className, value, children, activeTab, onTabChange, ...props }, ref) => {
  const isActive = activeTab === value

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onTabChange?.(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-background text-foreground shadow-sm" : "",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef(({ className, value, children, activeTab, ...props }, ref) => {
  if (activeTab !== value) return null

  // Filtrer les props qui ne doivent pas être passées au DOM
  const { value: _, activeTab: __, ...restProps } = props

  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...restProps}
    >
      {children}
    </div>
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }