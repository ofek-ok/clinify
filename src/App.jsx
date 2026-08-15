import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClinicProvider } from './context/ClinicContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import PublicFormView from './components/PublicFormView';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ClinicProvider>
          <Routes>
            <Route path="/form/:id" element={<PublicFormView />} />
            <Route path="/*" element={<Layout />} />
          </Routes>
        </ClinicProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
