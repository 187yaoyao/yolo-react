import React, { useState } from "react"
import ReactDOM from "react-dom"

function App() {
  const [num, setNum] = useState(100)

  return (
    <div onClick={e => {
      e.stopPropagation();
      setNum(num + 1)
    }}>
      {num}
    </div>
  )
}



const root = ReactDOM.createRoot(document.querySelector("#root"))

root.render(<App />)
