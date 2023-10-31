import { ScriptEditor } from "./ScriptEditor";

export const App = () => {
  return (
    <div style={{ padding: "10px" }}>
      <div style={{ display: "inline-block", width: "100%" }}>
        <div>SCRIPT A</div>
        <ScriptEditor />
      </div>
    </div>
  )
}