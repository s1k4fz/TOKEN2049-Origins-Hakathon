import { useEffect } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { AppRouter } from '@/pages/AppRouter'

function App() {
  const htmlLang = useMessages().meta.htmlLang

  useEffect(() => {
    document.documentElement.lang = htmlLang
  }, [htmlLang])

  return <AppRouter />
}

export default App
