/**
 * Focus Test Cases
 * 
 * Demonstrates the manual and AI-augmented actions of the Focus concept.
 */

import { Focus, User, Task } from './focus';
import { GeminiLLM, Config } from './gemini-llm';

/**
 * Load configuration from config.json
 */
function loadConfig(): Config {
    try {
        const config = require('../config.json');
        return config;
    } catch (error) {
        console.error('❌ Error loading config.json. Please ensure it exists with your API key.');
        console.error('Error details:', (error as Error).message);
        process.exit(1);
    }
}

// --- DEFINE A MOCK USER AND TASKS FOR TESTING ---
const user1: User = { id: 'user123' };

// These correspond to the "richer test cases" deliverable
const vagueTask: Task = { description: "Get organized for the week" };
const technicalTask: Task = { description: "Refactor the user authentication module to improve performance" };
const creativeTask: Task = { description: "Design a poster for the upcoming 'Code & Cookies' club bake sale" };
const interpersonalTask: Task = { description: "Give constructive feedback to a sensitive teammate about their recent work on the project" };


/**
 * Test case 1: Manual Actions
 * Demonstrates setting and clearing the current task without AI.
 */
export async function testManualActions(): Promise<void> {
    console.log('\n🧪 TEST CASE 1: Manual Actions');
    console.log('==================================');

    const focus = new Focus();

    console.log('📝 Setting a new task as the current focus...');
    focus.setCurrentTask(user1, { description: "Write initial draft of essay" });
    focus.displayFocus(user1);

    console.log('📝 Clearing the current task...');
    focus.clearCurrentTask(user1);
    focus.displayFocus(user1);
}

/**
 * Test case 2: The Vague Task
 * Probes the AI's ability to create a concrete step from an abstract goal.
 */
export async function testVagueTask(): Promise<void> {
    console.log('\n🧪 TEST CASE 2: AI Augmentation for a Vague Task');
    console.log('================================================');

    const focus = new Focus();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    console.log('📝 Setting the vague task as current focus...');
    focus.setCurrentTask(user1, vagueTask);
    focus.displayFocus(user1);

    // Let the LLM generate the first step
    await focus.generateFirstStep(user1, llm);

    // Display the final state with the AI suggestion
    console.log('\n🎯 Final state after LLM suggestion:');
    focus.displayFocus(user1);
}

/**
 * Test case 3: The Technical Task
 * Probes the AI's ability to handle domain-specific knowledge.
 */
export async function testTechnicalTask(): Promise<void> {
    console.log('\n🧪 TEST CASE 3: AI Augmentation for a Technical Task');
    console.log('====================================================');

    const focus = new Focus();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    console.log('📝 Setting the technical task as current focus...');
    focus.setCurrentTask(user1, technicalTask);
    focus.displayFocus(user1);

    // Let the LLM generate the first step
    await focus.generateFirstStep(user1, llm);

    // Display the final state
    console.log('\n🎯 Final state after LLM suggestion:');
    focus.displayFocus(user1);
}

/**
 * Test case 4: The Creative Task
 * Probes the AI's ability to suggest a process-oriented step for a creative block.
 */
export async function testCreativeTask(): Promise<void> {
    console.log('\n🧪 TEST CASE 4: AI Augmentation for a Creative Task');
    console.log('====================================================');

    const focus = new Focus();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    console.log('📝 Setting the creative task as current focus...');
    focus.setCurrentTask(user1, creativeTask);
    focus.displayFocus(user1);

    // Let the LLM generate the first step
    await focus.generateFirstStep(user1, llm);

    // Display the final state
    console.log('\n🎯 Final state after LLM suggestion:');
    focus.displayFocus(user1);
}

/**
 * Test Case 4: The Interpersonal Task
 * Probes if the AI can suggest an emotionally intelligent preparation step.
 */
export async function testInterpersonalTask(): Promise<void> {
    console.log('\n🧪 TEST CASE 4: The Edgy Interpersonal Task');
    console.log('=============================================');
    const focus = new Focus();
    const llm = new GeminiLLM(loadConfig());

    console.log('📝 Setting the creative task as current focus...');
    focus.setCurrentTask(user1, interpersonalTask);
    focus.displayFocus(user1);
    
    await focus.generateFirstStep(user1, llm);

    console.log('\n🎯 Final state after LLM suggestion:');
    focus.displayFocus(user1);
}


/**
 * Main function to run all test cases
 */
async function main(): Promise<void> {
    console.log('🎓 Focus Test Suite');
    console.log('========================\n');

    try {
        // Run manual actions test
        await testManualActions();
        
        // Run the 3 challenging AI test cases
        await testVagueTask();
        await testTechnicalTask();
        await testCreativeTask();
        await testInterpersonalTask();

        console.log('\n🎉 All test cases completed successfully!');

    } catch (error) {
        // The error messages from the implementation are already detailed
        console.error('\n❌ A test case failed. See error details above.');
        process.exit(1);
    }
}

// Run the main function if this file is executed directly
main();