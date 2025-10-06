<concept_spec>
concept Focus [User, Task]

    purpose
        to present a single task for the user to work on, with an AI-generated first step available on demand
  
    principle
        the user is shown one current task
        they can trigger an AI action to generate a single, small starting step for that task.

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
    
</concept_spec>