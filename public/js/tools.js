
const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") || "concept";

const toolConfigurations = {
    code: {
        title: "Code Assistant",
        description: "Generate, understand and debug programming code.",
        heading: "Get Programming Help",
        label: "Describe your coding requirement",
        placeholder: "Example: Write a Java program for inheritance with output...",
        prompt: "Act as an expert programming tutor. Help with code generation, debugging, error correction and step-by-step code explanations. Include corrected code and sample output where appropriate."
    },

    concept: {
        title: "Concept Explainer",
        description: "Understand complex academic topics in simple language.",
        heading: "Understand Any Concept",
        label: "What concept should AI explain?",
        placeholder: "Example: Explain cloud computing architecture with an example...",
        prompt: "Act as a patient college teacher. Explain the requested concept in simple language. Include a definition, key points, a practical example and a short summary."
    },

    viva: {
        title: "Viva Preparation",
        description: "Prepare for examinations with AI-generated viva questions and answers.",
        heading: "Prepare for Your Viva",
        label: "Enter your viva topic",
        placeholder: "Example: Java Multithreading or Cloud Computing...",
        prompt: "Act as a college viva examiner. Prepare 10 important viva questions and clear, concise answers about the given topic. Include basic, intermediate and application-based questions."
    },

    study: {
        title: "Study Support",
        description: "Create summaries, revision notes and study plans.",
        heading: "Plan Your Studies",
        label: "Enter your study topic",
        placeholder: "Example: Database Management System...",
        prompt: "Act as an academic study planner. Create useful revision notes for the requested topic. Include important definitions, key points, a concise summary and a short revision plan."
    }
};

const config = toolConfigurations[mode] || toolConfigurations.concept;

document.getElementById("toolTitle").textContent = config.title;
document.getElementById("toolDescription").textContent = config.description;
document.getElementById("formHeading").textContent = config.heading;
document.getElementById("detailsLabel").textContent = config.label;
document.getElementById("details").placeholder = config.placeholder;

const generateBtn = document.getElementById("generateBtn");
const statusText = document.getElementById("status");
const outputPanel = document.getElementById("outputPanel");
const outputContent = document.getElementById("outputContent");

generateBtn.addEventListener("click", generateResult);

async function generateResult() {
    const subject = document.getElementById("subject").value;
    const topic = document.getElementById("topic").value.trim();
    const details = document.getElementById("details").value.trim();

    if (!topic) {
        statusText.textContent = "Please enter a topic first.";
        return;
    }

    if (!details && mode === "code") {
        statusText.textContent = "Please describe what code you need.";
        return;
    }

    const message = `
${config.prompt}

Subject: ${subject}
Topic: ${topic}

Student's instructions:
${details || "Provide a complete and useful explanation for this topic."}

Make the response well-organised with suitable headings and examples.
`;

    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    statusText.textContent = "StudyMate AI is preparing your result. Please wait.";

    outputPanel.classList.remove("show");
    outputContent.textContent = "";

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                subject: subject,
                history: []
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "AI request failed.");
        }

        if (!data.reply) {
            throw new Error("No response received from AI.");
        }

        if (window.marked && window.DOMPurify) {
            outputContent.innerHTML = window.DOMPurify.sanitize(
                window.marked.parse(data.reply)
            );
        } else {
            outputContent.textContent = data.reply;
        }

        outputPanel.classList.add("show");
        statusText.textContent = "Your result has been generated successfully.";

        outputPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        statusText.textContent =
            "Error: " + error.message + " Please try again.";
        console.error("StudyMate AI tools error:", error);

    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate with AI";
    }
}

console.log("StudyMate AI learning tools loaded:", mode);
