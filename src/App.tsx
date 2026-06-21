import React from "react";
import { LoginPage } from "./views/Login";
import { DashboardPage } from "./views/Dashboard";
import { ExerciseFormPage } from "./views/ExerciseForm";
import { ExerciseViewPage } from "./views/ExerciseView";
import { ExerciseTryPage } from "./views/ExerciseTry";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

/*
 * Componente raíz de la aplicación.
 * BrowserRouter con basename "/PrismBackend" en producción porque el WAR se despliega
 * en ese contexto en Apache Tomcat; en desarrollo el basename es vacío.
 * Toaster (sonner) provee los mensajes toast globales de éxito/error.
 */
export default class App extends React.Component {
  constructor(props: {}) {
    super(props);
  }

  render() {
    return (
      <BrowserRouter basename={process.env.NODE_ENV === "production" ? "/PrismBackend" : ""}>
        <Routes>
          {/* Rutas principales de la SPA */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/exercises/new" element={<ExerciseFormPage />} />
          <Route path="/exercises/:id" element={<ExerciseViewPage />} />
          {/* ExerciseFormPage funciona tanto para crear (/new) como para editar (/:id/edit) */}
          <Route path="/exercises/:id/edit" element={<ExerciseFormPage />} />
          <Route path="/exercises/:id/probar" element={<ExerciseTryPage />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    );
  }
}
