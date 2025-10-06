# Assignment 3: Focus

I have chosen to augment the Focus concept. This concept is the most direct interface for the user's current work, making it the perfect place to introduce an AI feature that helps them overcome the initial friction of starting that very task. The "First Step" generator fits naturally here as a way to enhance the core purpose of the Focus concept, which is to eliminate decision fatigue.

## Concept: Focus

**Original Concept**

```
concept Focus [User, Task]
  purpose to eliminate decision fatigue by presenting the single task a user should be working on right now
  principle it presents the currently scheduled task to the user, providing a single point of focus
  state
    a CurrentTask element of User with
      a task Task
  actions
    setCurrentTask (user: User, task: Task)
      effect sets the specified task as the user's current focus
    clearCurrentTask (user: User)
      effect removes the current task for the user
    getCurrentTask (user: User): (task: optional Task)
      effect returns the user's current task, if any
```


**AI-Augmented Concept**

```
concept Focus [User, Task]
  purpose to present a single task for the user to work on, with an AI-generated first step available on demand
  principle the user is shown one current task; they can trigger an AI action to generate a single, small starting step for that task.

  state
    a CurrentTask element of User with
      a task Task
      
    an optional FirstStepSuggestion element of User with
      a forTask Task
      a suggestionText String

  actions
    setCurrentTask (user: User, task: Task)
      effect sets the specified task as the user's current task and clears any FirstStepSuggestion
      
    clearCurrentTask (user: User)
      effect removes the current task and any FirstStepSuggestion
      
    getCurrentTask (user: User): (task: optional Task)
      effect returns the user's current task, if any
    
    async generateFirstStep (user: User, task: Task)
      requires current task is set and matches the provided task
      effect calls an LLM to generate a five-min starting action and creates a FirstStepSuggestion
```

## User Interaction

![alt text](image.png)

**User Journey**

Alex opens the "Now" screen in her app and sees her most daunting task: "Write research paper." She feels stuck, facing the classic paralysis of not knowing where to start. Her eyes land on the expand icon next to "💡 Where can I start from?". Curious and needing a nudge, she taps it. The section smoothly expands, revealing a single, concrete suggestion from the AI: "Open a new document and write down five potential titles." The suggestion is small, clear, and not intimidating. The mental block shatters. Alex feels a sense of relief and immediately opens a document to begin. She has successfully overcome the initial inertia and started her work.

## Test cases and prompts

To ensure the "First Step" generator was robust, my testing focused on challenging scenarios designed to probe the AI's reasoning, safety, and contextual awareness. This iterative process was crucial, as initial tests with a simple prompt proved unreliable, often failing on complex tasks or making unhelpful assumptions. This led to the development of a final prompt with a clear persona, strict formatting rules, and a key instruction to remain tool-agnostic. The following experiments were run using this final, refined prompt.

**Experiment 1: Handling Ambiguity**

- Test Scenario: The task "Get organized for the week" was designed to measure the AI's ability to create a concrete action from an abstract goal.

- Analysis: The model succeeded by suggesting, "List three main tasks you need to accomplish this week." This is a high-quality response because it correctly identifies that the first step to "getting organized" is prioritizing. It effectively transforms a vague and overwhelming goal into a simple, contained list-making activity, perfectly aligning with the feature's purpose.

**Experiment 2: Navigating Technical Complexity**

- Test Scenario: For the task "Refactor the user authentication module to improve performance," I wanted to assess the AI's safety on a technical task where it lacks context. A poor suggestion could encourage reckless behavior.

- Analysis: The suggestion, "Open the directory containing your project's authentication module," demonstrates a safe, if cautious, approach. The AI wisely prioritized orienting the user before they performed any potentially destructive actions. This highlights a key limitation: without deeper context, the AI defaults to the simplest physical action rather than offering more strategic, expert-level advice like "run a performance profiler," which would require additional knowledge.

**Experiment 3: Addressing Interpersonal Anxiety**

- Test Scenario: This high-stakes task, "Give constructive feedback to a sensitive teammate about their recent work," tested for emotional intelligence, as the primary barrier is anxiety, not complexity.

- Analysis: The AI's response, "Write down three specific positive aspects of their recent work," was exceptionally nuanced. Instead of suggesting the direct act of communication, it suggested a preparatory step that reframes the user’s task, reduces their anxiety, and makes a positive outcome far more likely. This demonstrates the model's ability to infer the underlying emotional context of a task and provide a genuinely strategic and helpful starting point.


## Validations

To protect the user from unhelpful or counterproductive AI suggestions, I implemented three distinct validators to check for plausible logical issues in the LLM's output. First, the AI might produce a non-actionable suggestion, such as a question or a reflective statement, which would fail to provide the user with a clear starting point. To prevent this, the validateIsActionable function checks that the suggestion begins with a verb from a comprehensive, predefined list of action words (e.g., "Open," "Write," "List"). Second, the AI could suggest a task with too large a scope, defeating the feature's purpose of providing a small, non-intimidating step. The validateIsShort validator mitigates this by scanning the output for "red-flag phrases" like "complete the project" or "the entire chapter" that imply a task longer than five minutes. Finally, the AI might return a verbose, multi-sentence response, which would increase the user's cognitive load. The validateIsSingleSentence validator enforces brevity by ensuring there is no sentence-terminating punctuation (. ? !) followed by additional text, guaranteeing the user receives only a single, focused command.
