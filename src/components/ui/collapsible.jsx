import * as React from "react"

const Collapsible = React.forwardRef(({ open, defaultOpen, onOpenChange, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen || open || false)

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onOpenChange?.(newState)
  }

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  return (
    <div ref={ref} {...props}>
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child, { isOpen, onToggle: handleToggle })
          : child
      )}
    </div>
  )
})
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef(({ children, isOpen, onToggle, asChild, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onToggle}
    {...props}
  >
    {children}
  </button>
))
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef(({ children, isOpen, className, ...props }, ref) => (
  <div
    ref={ref}
    className={className}
    style={{
      display: isOpen ? 'block' : 'none'
    }}
    {...props}
  >
    {children}
  </div>
))
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }