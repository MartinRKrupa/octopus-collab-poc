import { ScriptEditor } from "./ScriptEditor";

export const App = () => {
  return (
    <div style={{ padding: "10px" }}>
      <div style={{ display: "inline-block", width: "45%" }}>
        <div>SCRIPT A</div>
        <ScriptEditor />
      </div>
      {/*
      <div style={{ display: "inline-block", width: "10px" }}>
      </div>
      <div style={{ display: "inline-block", width: "45%" }}>
        <div>SCRIPT B</div>
        <ScriptEditor />
      </div>
    */}
    </div>
  )
}