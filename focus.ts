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
            You are a productivity coach who helps users overcome procrastination.
            Your goal is to provide a single, concrete, physical or digital action that a person can complete in five minutes or less to get started on their task.

            The action should be a direct command. Do not ask questions or offer encouragement.

            TASK: "${task.description}"

            Return your response as a JSON object with this exact structure:
            {
            "suggestion": "The five-minute starting action."
            }

            Return ONLY the JSON object, no additional text or markdown.`;
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

            this.validateNotEmpty(suggestionText);
            this.validateIsActionable(suggestionText);
            this.validateIsShort(suggestionText);

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
        const ACTION_VERBS = ["open", "write", "create", "list", "set", "review", "find", "make", "take", "move", "go", "identify"];
        const firstWord = text.trim().split(' ')[0].toLowerCase();
        if (!ACTION_VERBS.some(verb => firstWord.startsWith(verb))) {
            throw new Error(`Validation Error: Suggestion is not an actionable command. Got: "${text}"`);
        }
    }

    private validateIsShort(text: string): void {
        const RED_FLAG_WORDS = ["complete", "entire", "whole", "fully", "finish", "build the"];
        const lowerText = text.toLowerCase();
        if (RED_FLAG_WORDS.some(word => lowerText.includes(word))) {
            throw new Error(`Validation Error: Suggestion implies too large a scope. Got: "${text}"`);
        }
    }

    private validateNotEmpty(text: string): void {
        if (text.trim().length === 0) {
            throw new Error(`Validation Error: Suggestion is empty or just whitespace.`);
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