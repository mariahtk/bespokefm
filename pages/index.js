export default function Home() {
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    const res = await fetch("/api/generate", {
      method: "POST",
      body: file,
    });
    const data = await res.json();
    alert(data.message || data.error);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Bespoke FM Generator</h1>
      <input type="file" accept=".xlsm" onChange={handleFileUpload} />
      <p>Upload your Bespoke Input Sheet to generate the model.</p>
    </div>
  );
}
