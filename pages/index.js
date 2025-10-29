import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [address, setAddress] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("address_raw", address);
    formData.append("additional_info", "");
    formData.append("latitude", 0);
    formData.append("longitude", 0);
    formData.append("sqft", 1000);
    formData.append("market_rent", 15);
    formData.append("yes_no_value", "Yes");
    formData.append("num_floors", 1);

    const res = await fetch("http://<YOUR_BACKEND_URL>:8000/generate-model/", {
      method: "POST",
      body: formData,
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Updated_Model.xlsm");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
      <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
      <button type="submit">Generate Model</button>
    </form>
  );
}
