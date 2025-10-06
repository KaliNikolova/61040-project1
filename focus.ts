/**
 * DayPlanner Concept - AI Augmented Version
 */

import { GeminiLLM } from './gemini-llm';

// A simple representation of a user
export interface User {
    id: string;
}

// A task the user needs to complete
export interface Task {
    description: string;
}

// The AI-generated suggestion for a 5-min sub-task
export interface FirstStepSuggestion {
    forTask: Task;
    suggestionText: string;
}

export class Focus {
    // State is stored in Maps to handle multiple users
    private currentTasks: Map<string, Task> = new Map();
    private suggestions: Map<string, FirstStepSuggestion> = new Map();

    setCurrentTask(user: User, task: Task): void {
        console.log(`Setting current task for user ${user.id}: "${task.description}"`);
        this.currentTasks.set(user.id, task);
        // When the task changes, the old suggestion is no longer valid
        this.suggestions.delete(user.id);
    }

    clearCurrentTask(user: User): void {
        console.log(`Clearing current task for user ${user.id}`);
        this.currentTasks.delete(user.id);
        this.suggestions.delete(user.id);
    }

    getCurrentTask(user: User): Task | undefined {
        return this.currentTasks.get(user.id);
    }
    
    async generateFirstStep(user: User, llm: GeminiLLM): Promise<void> {
        const currentTask = this.getCurrentTask(user);

        if (!currentTask) {
            throw new Error(`Cannot generate first step for user ${user.id}: no current task is set.`);
        }

        try {
            console.log(`🤖 Requesting a "first step" from Gemini AI for task: "${currentTask.description}"`);

            const prompt = this.createFirstStepPrompt(currentTask);
            const text = await llm.executeLLM(prompt);

            console.log('✅ Received response from Gemini AI!');
            console.log('\n🤖 RAW GEMINI RESPONSE');
            console.log('======================');
            console.log(text);
            console.log('======================\n');

            // Parse, validate, and store the suggestion
            this.parseAndStoreSuggestion(text, user, currentTask);

        } catch (error) {
            console.error('❌ Error calling Gemini API:', (error as Error).message);
            throw error;
        }
    }

    /**
     * Creates the prompt for Gemini to generate a first step.
     */
    private createFirstStepPrompt(task: Task): string {
        return `
            You are a productivity AI. Your only goal is to defeat procrastination.
            Your goal is to provide a single, concrete, physical or digital action that a person can complete in five minutes or less to get started on their task.

            CRITICAL RULES:
            1. The action must be a single sentence.
            2. The action must be a direct concrete command (e.g., "Open...", "Write...", "List..."). Do not suggest mental actions like "Think about...". Give something that is easily executable given your instructions.
            3. Your entire output MUST be ONLY a valid JSON object. Do not add any other text, explanations, or markdown formatting like \`\`\`json.
            4. Be accurate - suggest ONLY actions that correspond to starting the task and are helpful.
            5. Do not make unwarranted assumptions about the user's context, tools, and workflow.

            TASK: "${task.description}"

            JSON OUTPUT:
            {
            "suggestion": "The short, actionable command."
            }`;
    }

    /**
     * Parses the LLM response, runs validators, and stores the suggestion.
     */
    private parseAndStoreSuggestion(responseText: string, user: User, forTask: Task): void {
        try {
            // Extract JSON from response, which is a robust way to handle extra text
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON object found in the LLM response.');
            }

            const response = JSON.parse(jsonMatch[0]);

            if (typeof response.suggestion !== 'string') {
                throw new Error('Invalid response format: JSON must have a "suggestion" field of type string.');
            }

            const suggestionText = response.suggestion;
            console.log('📝 Validating and applying LLM suggestion...');

            this.validateIsActionable(suggestionText);
            this.validateIsShort(suggestionText);
            this.validateIsSingleSentence(suggestionText);

            const suggestion: FirstStepSuggestion = {
                forTask,
                suggestionText,
            };

            this.suggestions.set(user.id, suggestion);
            console.log(`✅ Stored suggestion for user ${user.id}: "${suggestionText}"`);

        } catch (error) {
            console.error('❌ Error parsing or validating LLM response:', (error as Error).message);
            console.log('Original response was:', responseText);
            throw error;
        }
    }

    // --- VALIDATORS ---

    private validateIsActionable(text: string): void {
        const ACTION_VERBS = [
            // --- Creation & Writing ---
            "write", "create", "draft", "outline", "list", "sketch", "draw", "jot", "type",

            // --- Investigation & Research ---
            "find", "search", "look up", "read", "review", "identify", "gather", "watch",

            // --- Setup & Organization ---
            "open", "set up", "organize", "schedule", "book", "add", "download", "install",

            // --- Communication & Interpersonal ---
            "email", "message", "call", "ask", "send",

            // --- Physical Actions ---
            "take out", "move", "put", "go to", "get",

            // --- Technical & Process Actions ---
            "run", "test", "debug", "check"
        ];
        const firstWord = text.trim().split(' ')[0].toLowerCase();
        if (!ACTION_VERBS.some(verb => firstWord.startsWith(verb))) {
            throw new Error(`Validation Error: Suggestion is not an actionable command. Got: "${text}"`);
        }
    }

    private validateIsShort(text: string): void {
        const RED_FLAG_PHRASES = [
            // --- Verbs of Finality or Creation + a Large Noun ---
            // These imply finishing or building a significant component.
            "complete the",
            "finish the",
            "finalize the",
            "implement the",
            "build the",
            "design the",
            "write the entire",
            "write the full",
            "create the whole",

            // --- Nouns Indicating a Large, Undefined Scope ---
            // These words suggest a major milestone, not a first step.
            "the entire module",
            "the whole chapter",
            "the full draft",
            "the first draft",
            "the final version",
            "the complete list", // "a list" is okay, "the complete list" is not.

            // --- General Phrases Implying a Large Quantity of Work ---
            "all of the",
            "every part of",
            "the rest of the",
            "organize all",
            "clean the entire"
        ];
        const lowerText = text.toLowerCase();
        if (RED_FLAG_PHRASES.some(word => lowerText.includes(word))) {
            throw new Error(`Validation Error: Suggestion implies too large a scope. Got: "${text}"`);
        }
    }

    /**
     * Validator to ensure the suggestion is only one sentence.
     * It checks for sentence-terminating punctuation (. ? !) followed by more text.
     */
    private validateIsSingleSentence(text: string): void {
        // Find the index of the first sentence-ending character.
        const terminators = ['.', '?', '!'];
        const indices = terminators.map(t => text.indexOf(t)).filter(i => i !== -1);

        // If there's no sentence-ending punctuation at all, it's a single command. That's valid.
        if (indices.length === 0) {
            return;
        }

        const firstTerminatorIndex = Math.min(...indices);

        // Check if there is any non-whitespace text after the first punctuation mark.
        const remainingText = text.substring(firstTerminatorIndex + 1).trim();

        if (remainingText.length > 0) {
            throw new Error(`Validation Error: Suggestion must be a single sentence. Got: "${text}"`);
        }
    }

    /**
     * Displays the current focus state for a given user.
     */
    displayFocus(user: User): void {
        const task = this.currentTasks.get(user.id);
        const suggestion = this.suggestions.get(user.id);

        console.log(`\n🎯 Current Focus for User: ${user.id}`);
        console.log('===================================');

        if (task) {
            console.log(`TASK: ${task.description}`);
            if (suggestion) {
                console.log(`💡 FIRST STEP: ${suggestion.suggestionText}`);
            } else {
                console.log(`(No first step generated yet)`);
            }
        } else {
            console.log('No task currently in focus.');
        }
        console.log('===================================\n');
    }
}