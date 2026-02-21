import { Link } from "react-router-dom";
import {
  PRINCIPES_ET_VALEURS,
  SYSTEME_INSTITUTIONNEL,
  DROITS_ET_DEVOIRS,
  HISTOIRE_ET_GEOGRAPHIE,
  VIVRE_EN_SOCIETE,
  CATEGORY_SLUGS,
} from "../data/categories";
import allQuestions from "../data/questions";

const questions = allQuestions.filter((q) => q.choices.length > 0);

const CATEGORY_ICONS = {
  [PRINCIPES_ET_VALEURS]: "\u2696\uFE0F",
  [SYSTEME_INSTITUTIONNEL]: "\uD83C\uDFDB\uFE0F",
  [DROITS_ET_DEVOIRS]: "\uD83D\uDCDC",
  [HISTOIRE_ET_GEOGRAPHIE]: "\uD83C\uDF0D",
  [VIVRE_EN_SOCIETE]: "\uD83E\uDD1D",
};

const categoryOptions = Object.entries(CATEGORY_ICONS).map(([name, icon]) => ({
  name,
  icon,
  slug: CATEGORY_SLUGS[name],
  firstId: questions.find((q) => q.category === name).id,
}));

export default function StudyPicker({ onSelect }) {
  return (
    <div className="study-picker">
      <h2 className="study-picker-title">Choisissez une catégorie à réviser</h2>
      <div className="study-picker-list">
        <Link to={`/study/all/${questions[0].id}`} className="study-picker-btn" onClick={onSelect}>
          <span className="study-picker-icon">📖</span>
          Toutes les questions
        </Link>
        {categoryOptions.map(({ name, icon, slug, firstId }) => (
          <Link key={name} to={`/study/${slug}/${firstId}`} className="study-picker-btn" onClick={onSelect}>
            <span className="study-picker-icon">{icon}</span>
            {name}
          </Link>
        ))}
      </div>
    </div>
  );
}
