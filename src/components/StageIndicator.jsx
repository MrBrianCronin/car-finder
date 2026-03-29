export default function StageIndicator({ stages, currentStage, answers, questions }) {
  // Determine which stages are complete
  const stageStatus = stages.map(stage => {
    const stageQuestions = questions.filter(q => q.stage === stage.id);
    const answeredInStage = stageQuestions.filter(q => answers[q.id] !== undefined).length;
    const activeInStage = stageQuestions.filter(q => !q.skipIf || !q.skipIf(answers)).length;

    let status = 'upcoming';
    if (stage.id === currentStage) status = 'active';
    else if (answeredInStage > 0 && answeredInStage >= activeInStage) status = 'complete';
    else if (answeredInStage > 0) status = 'partial';

    return { ...stage, status };
  });

  return (
    <div className="stage-indicator">
      {stageStatus.map((stage) => (
        <div
          key={stage.id}
          className={`stage-dot-wrapper ${stage.status}`}
          title={stage.label}
        >
          <div
            className="stage-dot"
            style={{
              borderColor: stage.status === 'active' ? stage.color : undefined,
              backgroundColor: stage.status === 'complete' ? stage.color : undefined,
            }}
          >
            {stage.status === 'complete' ? '✓' : stage.icon}
          </div>
          <span className="stage-dot-label">{stage.label}</span>
        </div>
      ))}
    </div>
  );
}
