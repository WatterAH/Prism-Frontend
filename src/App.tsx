import React from "react";
import { Login } from "./views/Login";
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default class App extends React.Component {
  constructor(props: {}) {
    super(props);
  }

  render() {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );
  }
}
