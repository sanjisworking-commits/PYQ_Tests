import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AttemptPage } from './pages/AttemptPage'
import { AttemptTestsPage } from './pages/AttemptTestsPage'
import { DashboardPlaceholderPage } from './pages/DashboardPlaceholderPage'
import { HomePage } from './pages/HomePage'
import { InstructionsPage } from './pages/InstructionsPage'
import { ResultsPage } from './pages/ResultsPage'
import { ReviewPage } from './pages/ReviewPage'
import { UpscPage } from './pages/UpscPage'
import { YearTestsPage } from './pages/YearTestsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upsc" element={<UpscPage />} />
        <Route path="/upsc/tests" element={<AttemptTestsPage />} />
        <Route path="/upsc/tests/:year" element={<YearTestsPage />} />
        <Route
          path="/upsc/tests/:year/:slug/instructions"
          element={<InstructionsPage />}
        />
        <Route
          path="/upsc/tests/:year/:slug/attempt"
          element={<AttemptPage />}
        />
        <Route path="/results/:attemptId" element={<ResultsPage />} />
        <Route path="/review/:attemptId" element={<ReviewPage />} />
        <Route path="/dashboard" element={<DashboardPlaceholderPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
