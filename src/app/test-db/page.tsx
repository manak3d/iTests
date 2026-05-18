"use client";

import { useState } from "react";

export default function TestDbPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      subjects: formData.get("subjects"),
    };

    try {
      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resultData = await response.json();
      setResult(resultData);
    } catch (err) {
      setResult({ success: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border border-gray-200 rounded-xl shadow-lg bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Test přidání učitele (Klient -&gt; DB)</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Křestní jméno</label>
          <input 
            id="firstName" 
            name="firstName" 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
        </div>
        
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Příjmení</label>
          <input 
            id="lastName" 
            name="lastName" 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
        </div>

        <div>
          <label htmlFor="subjects" className="block text-sm font-medium text-gray-700 mb-1">Předměty (oddělené čárkou)</label>
          <input 
            id="subjects" 
            name="subjects" 
            placeholder="např. Matematika, Fyzika" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? "Odesílám..." : "Přidat učitele do DB"}
        </button>
      </form>

      {result && (
        <div className={`mt-6 p-4 rounded-md ${result.success ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          <h3 className="font-bold text-lg mb-2">{result.success ? "✅ Úspěšně uloženo!" : "❌ Chyba!"}</h3>
          <p className="text-sm mb-2">{result.success ? "Data z tohoto formuláře se úspěšně poslala přes API do MongoDB." : "Něco se pokazilo:"}</p>
          <pre className="text-xs mt-2 overflow-auto bg-white/50 p-2 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
