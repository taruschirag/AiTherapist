import React, { useState } from "react";

function App() {
  const [yearlyGoal, setYearlyGoal] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [journal, setJournal] = useState("");
  const [insights, setInsights] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      goals: {
        yearly: yearlyGoal,
        monthly: monthlyGoal,
        weekly: weeklyGoal,
      },
      journal: journal,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/goals-journals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message); // Display success message
        // Clear form after successful submission
        setYearlyGoal("");
        setMonthlyGoal("");
        setWeeklyGoal("");
        setJournal("");
      } else {
        alert("Failed to save data.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while saving data.");
    }
  };

  const handleTherapistInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/generate-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setInsights(result.insights);
      } else {
        // Get the error message from the response
        const errorData = await response.json();
        alert(`Failed to generate insights: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(`An error occurred while generating insights: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Goals and Journals</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block mb-2">
            Yearly Goal:
            <input
              type="text"
              value={yearlyGoal}
              onChange={(e) => setYearlyGoal(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </label>
        </div>

        <div>
          <label className="block mb-2">
            Monthly Goal:
            <input
              type="text"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </label>
        </div>

        <div>
          <label className="block mb-2">
            Weekly Goal:
            <input
              type="text"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </label>
        </div>

        <div>
          <label className="block mb-2">
            Journal:
            <textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              className="w-full p-2 border rounded mt-1 h-32"
            ></textarea>
          </label>
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Submit
        </button>
      </form>

      <div className="mt-8">
        <button
          onClick={handleTherapistInsights}
          disabled={isLoading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-purple-300"
        >
          {isLoading ? "Generating Insights..." : "Need Therapy?"}
        </button>

        {insights && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Therapist Insights</h2>
            <p className="whitespace-pre-wrap">{insights}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App