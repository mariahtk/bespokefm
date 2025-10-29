async function handleUpload(event) {
  const file = event.target.files[0];
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/generate", {
    method: "POST",
    body: file,
  });

  const data = await res.json();
  alert(data.message || data.error);
}
