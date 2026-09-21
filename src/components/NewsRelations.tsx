import {
  Buildings,
  Check,
  GlobeHemisphereWest,
  Lightbulb,
  ShareNetwork,
} from "@phosphor-icons/react";
import type { NewsRelation, RelationType } from "../utils/newsAnalysis";

interface NewsRelationsProps {
  stockName: string;
  relations: NewsRelation[];
  activeRelationId: string | null;
  onSelect: (relation: NewsRelation) => void;
}

const groups: Array<{
  type: RelationType;
  label: string;
  limit: number;
  Icon: typeof Buildings;
}> = [
  { type: "company", label: "함께 나온 회사", limit: 3, Icon: Buildings },
  { type: "theme", label: "관련 산업·기술", limit: 3, Icon: Lightbulb },
  { type: "region", label: "관련 국가·지역", limit: 2, Icon: GlobeHemisphereWest },
];

export function NewsRelations({
  stockName,
  relations,
  activeRelationId,
  onSelect,
}: NewsRelationsProps) {
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      relations: relations.filter((relation) => relation.type === group.type).slice(0, group.limit),
    }))
    .filter((group) => group.relations.length > 0);
  const activeRelation = relations.find((relation) => relation.id === activeRelationId);

  return (
    <section className="analysis-card relation-card" aria-labelledby="news-relations-title">
      <div className="analysis-card__heading">
        <span className="analysis-card__icon" aria-hidden="true">
          <ShareNetwork size={24} weight="fill" />
        </span>
        <div>
          <p className="analysis-card__kicker">기사 속 동시 언급 분석</p>
          <h2 id="news-relations-title">{stockName} 뉴스 연관 지도</h2>
        </div>
      </div>

      <p className="relation-card__lead">
        최근 기사에서 {stockName}과 함께 나온 회사와 이슈입니다.
      </p>

      {visibleGroups.length > 0 ? (
        <div className="relation-groups">
          {visibleGroups.map(({ type, label, Icon, relations: groupRelations }) => (
            <section className="relation-group" aria-labelledby={`relation-group-${type}`} key={type}>
              <h3 id={`relation-group-${type}`}>
                <Icon size={20} weight="bold" aria-hidden="true" />
                {label}
              </h3>
              <div className="relation-buttons">
                {groupRelations.map((relation) => {
                  const active = relation.id === activeRelationId;
                  return (
                    <button
                      type="button"
                      className={active ? "is-active" : ""}
                      aria-pressed={active}
                      aria-label={`${relation.name} 관련 기사 ${relation.articleCount}개${active ? ", 필터 해제" : "만 보기"}`}
                      onClick={() => onSelect(relation)}
                      key={relation.id}
                    >
                      <strong>{relation.name}</strong>
                      <span className="relation-button__meta">
                        {active ? <Check size={17} weight="bold" aria-hidden="true" /> : null}
                        기사 {relation.articleCount}건 · 언론사 {relation.sourceCount}곳
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="relation-card__empty">아직 반복해서 함께 나온 항목이 없습니다.</p>
      )}

      <p className="relation-card__selection" aria-live="polite" aria-atomic="true">
        {activeRelation
          ? `‘${activeRelation.name}’ 관련 기사 ${activeRelation.articleCount}개를 아래에 모았습니다.`
          : "항목을 누르면 관련 기사만 아래에서 볼 수 있습니다."}
      </p>

      <p className="analysis-card__note">
        같은 기사에 함께 등장했다는 뜻이며, 실제 사업 관계나 주가 영향을 단정하지 않습니다.
      </p>
    </section>
  );
}
