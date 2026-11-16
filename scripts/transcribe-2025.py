#!/usr/bin/env python3
"""Manual visual transcription of supplied scanned PDF pages 4–11.
Answer letters visually verified on supplied answer PDF pages 2–3.
No OCR or external service used by this script.
"""
import json
from pathlib import Path

def question(number,stem,options,answer,evidence,reason):
    return {'number':number,'stem':stem,'options':options,'answer':'ABCD'.index(answer),
            'evidence':evidence,'explanation':f'参考答案：{answer}（用户提供的机构答案）。'+reason,'optionNotes':[]}

def lesson(n,title,topic,summary,structure,tips,paragraphs,questions):
    return {'id':f'past-2025-{n}','title':title,'englishTitle':f'2025 · Text {n}','year':2025,'textNumber':n,
        'kind':'past','topic':topic,'level':'历年真题','minutes':18,
        'source':'用户提供扫描原卷及机构参考答案；中文导读和定位解析为学习辅助',
        'sourceFile':'2025年考研英语二真题.pdf','answerSourceFile':'2025年考研英语二真题答案.pdf',
        'transcription':'逐页视觉转录；原卷 PDF 第 4—11 页、答案 PDF 第 2—3 页',
        'summary':summary,'structure':structure,'tips':[{'title':a,'body':b} for a,b in tips],
        'paragraphs':[{'en':p,'zh':''} for p in paragraphs],'questions':questions}

lessons=[lesson(1,'数字支付时代的小费膨胀','消费与服务',
 '文章回顾美国小费习惯与数字支付带来的变化，讨论索取小费的服务范围、时间和金额如何扩张。作者分析小费对收入与公平的作用，并指出顾客感受到的压力及小费与服务质量联系的减弱。',
 ['传统小费对象与数字支付普及','服务之后给小费的奖励作用','预先索取及自动添加小费','支付设备推动范围与金额扩张','小费补充低薪劳动者收入','小费受益不均与取消小费的尝试','雇主激励与顾客压力之间的矛盾'],
 [('用时间线读变化','historically、in the past、today 对应不同的小费规则，答题时先确认时代。'),('把两个概念分开','tip creep 关注适用服务范围，tipflation 关注金额上涨，观察各自的解释句。'),('区分目的与效果','取消小费的原始目的、实际进展和顾客反应分别出现在不同段落。')],
 [
 'U.S. customers historically tipped people they assumed were earning most of their income via tips, such as restaurant servers earning less than the minimum wage. In the early 2010s, a wide range of businesses started processing purchases with iPads and other digital payment systems. These systems often prompted customers to tip for services that were not previously tipped.',
 'Today’s tip requests are often not connected to the salary and service norms that used to determine when and how people tip. Customers in the past nearly always paid tips after receiving a service, such as at the conclusion of a restaurant meal, after getting a haircut or once a pizza was delivered. That timing could reward high-quality service and give workers an incentive to provide it.',
 'It’s becoming more common for tips to be requested beforehand. And new tipping technology may even automatically add tips.',
 'The prevalence of digital payment devices has made it easier to ask customers for a tip. That helps explain why tip requests are creeping into new kinds of services. Customers now routinely see menus of suggested default options—often well above 20% of what they owe. The amounts have risen from 10% or less in the 1950s to 15% around the year 2000 to 20% or higher today. This increase is sometimes called tipflation—the expectation of ever-higher tip amounts.',
 'Tipping has always been a vital source of income for workers in historically tipped services, like restaurants, where the tipped minimum wage can be as low as US$2.13 an hour. Tip creep and tipflation are now further supplementing the income of many low-wage service workers.',
 'Notably, tipping primarily benefits some of these workers, such as waiters, but not others, such as cooks and dishwashers. To ensure that all employees were paid fair wages, some restaurants banned tipping and increased prices, but this movement toward no-tipping services has largely fizzled out.',
 'So, to increase employee wages without raising prices, more employers are succumbing to the temptations of tip creep and tipflation. However, many customers are frustrated because they feel they are being asked for too high of a tip, too often. And, as our research emphasizes, tipping now seems to be more coercive, less generous and often completely disassociated from service quality.'
 ],[
 question(21,'According to Paragraph 1, the practice of tipping in the U.S. _____.',['was regarded as a sign of generosity','was considered essential for waiters','was a way of rewarding diligence','was optional in most businesses'],'B',0,'首段说明人们给那些主要靠小费获得收入的人小费，并以工资低于最低工资的餐厅服务员为例。'),
 question(22,'Compared with tips in the past, today’s tips _____.',['are paid much less frequently','are less often requested in advance','have less to do with service quality','contribute less to workers’ income'],'C',1,'过去小费通常在服务后给付，可以奖励优质服务；如今预先索取、自动添加，与服务质量的联系减弱。'),
 question(23,'Tip requests are creeping into new kinds of services as a result of _____.',['the advancement of technology','the desire for income increase','the diversification of business','the emergence of tipflation'],'A',3,'第四段说数字支付设备普及使索取小费更容易，随即解释其进入新服务领域的原因。'),
 question(24,'The movement toward no-tipping services was intended to _____.',['promote consumption','enrich income sources','maintain reasonable prices','guarantee income fairness'],'D',5,'第六段用 To ensure that all employees were paid fair wages 明确说明取消小费的目的。'),
 question(25,'It can be learned from the last paragraph that tipping _____.',['is becoming a burden for customers','helps encourage quality service','is vital to business development','reflects the need to reduce prices'],'A',6,'末段说顾客感到被过于频繁地索取过高小费，且过程更具强迫性，体现顾客负担。')
 ]),
 lesson(2,'英国医疗体系需要怎样的转变','topic-pending',
 '文章认为英国现有医疗服务模式难以适应变化后的健康需求，提出加强社区与初级保健，并重新思考以医院为中心的体系。作者强调生活和工作环境等社会因素，以及中央和地方之间的职能分配。',
 ['医疗服务模式与新需求之间出现落差','等候、支出和人员压力日益突出','加强社区、初级保健与社会照护','提出重新思考医院中心模式','重视影响健康的社会因素','讨论中央与地方的权力资源分配'],
 [('区分 health 与 healthcare','文章逐步从医疗服务转向健康的社会决定因素，观察论述范围怎样扩大。'),('措施题定位具体投入','社区、初级保健、医院和社会照护的作用不同，保留每项建议的对象。'),('推断题读清现状与建议','末段描述地方已有的优势，并追问应如何分配职能，作答时区分二者。')],
 [
 'When it was established, the National Health Service (NHS) was visionary: offering high-quality, timely care to meet the dominant needs of the population it served. Nearly 75 years on, with the UK facing very different health challenges, it is clear that the model is out of date.',
 'From life expectancy to cancer and infant mortality rates, we are lagging behind many of our peers. With more than 6.8 million on waitlists, healthcare is becoming increasingly inaccessible for those who cannot opt to pay for private treatment; and the cost of providing healthcare is increasingly squeezing out investment in other public services. As demand for healthcare continues to grow, pressures on the workforce—which is already near breaking point—will only become more acute.',
 'Many of the answers to the crisis in health and care are well rehearsed. We need to be much better at reducing and diverting demand on health services, rather than simply managing it. Much more needs to be invested in communities and primary care to reduce our reliance on hospitals. And capacity in social care needs to be greater, to support the growing number of people living with long-term conditions.',
 'Yet despite two decades of strategies and a number of major health reforms, we have failed to make meaningful progress on any of these aims. That is why the Reform think tank is launching a new programme of work entitled “Reimagining health”, supported by ten former health ministers. Together, we are calling for a much more open and honest conversation about the future of health in the UK, and an “urgent rethink” of the hospital-centric model we retain.',
 'This must begin with the question of how we maximise the health of the nation, rather than “fix” the NHS. It is estimated, for example, that healthcare accounts for only about 20% of health outcomes. Much more important are the places we live, work and socialise—yet there is no clear cross-government strategy for improving these social determinants of health. Worse, when policies like the national obesity strategy are scrapped, taxpayers are left with the heavy price tag of treating the illnesses, like diabetes, that result.',
 'Reform wants to ask how power and resources should be distributed in our health system. What health functions should remain at the centre, and what should be given to local leaders, often responsible for services that create health, and with a much better understanding of the needs of their populations?'
 ],[
 question(26,'According to the first two paragraphs, the NHS _____.',['is troubled by funding deficiencies','can hardly satisfy people’s needs','can barely retain its current employees','is rivalled by private medical services'],'B',1,'首段说模式过时，第二段列出健康指标落后、大量等候和服务难以获得，说明难满足当前需求。'),
 question(27,'One answer to the crisis in health and care is to _____.',['boost the efficiency of hospitals','lighten the burden on social care','increase resources for primary care','reduce the pressure on communities'],'C',2,'第三段明确建议向 communities and primary care 投入更多资源。'),
 question(28,'“Reimagining health” is aimed to _____.',['reinforce hospital management','readjust healthcare regulations','restructure the health system','resume suspended health reforms'],'C',3,'第四段要求重新思考以医院为中心的模式，并讨论未来健康体系，指向体系重构。'),
 question(29,'To maximise the nation’s health, the author suggests _____.',['introducing relevant taxation policies','paying due attention to social factors','reevaluating major health outcomes','enhancing the quality of health care'],'B',4,'第五段强调居住、工作和社交环境等社会决定因素的重要性。'),
 question(30,'It can be inferred that local leaders should _____.',['exercise their power more reasonably','develop a stronger sense of responsibility','play a bigger role in the health system','understand people’s health needs better'],'D',5,'此题资料参考答案有疑义，待复核。答案页给 D；原文末段已描述地方领导更了解居民需求，并讨论应向地方分配哪些职能，C 也具有直接的推断依据。请保留两者的论证差异。')
 ]),
 lesson(3,'高温行动计划怎样适应当地风险','topic-pending',
 '文章介绍印度高温行动计划及执行中的问题，重点分析预警标准与当地气候、湿度和脆弱人群的关系。研究者建议用风险地图指导资源投入，同时把短期应急扩展到社区降温等长期措施。',
 ['介绍高温计划及具体应对措施','实施与本地化预警标准存在不足','孟买案例显示湿度和遮阴的重要性','提出可因地制宜的示范计划和脆弱性地图','用少量关键指标识别重点社区','从短期救急扩展到长期降温'],
 [('区分气温与综合风险','daytime、nighttime、humidity 分别提供不同信息，注意预警标准的适用地区。'),('案例题看它检验什么','孟买气温未到阈值仍发生死亡，思考这个例子为何支持改进预警。'),('按时间尺度整理措施','预警与救治属于应急，种树和建筑改造属于更长期的行动。')],
 [
 'Heat action plans, or HAPs, have been proliferating in India in the past few years. In general, an HAP spells out when and how officials should issue heat warnings and alert hospitals and other institutions. Nagpur’s plan, for instance, calls for hospitals to set aside “cold wards” in the summer for treating heatstroke patients, and advises builders to give construction laborers a break from work on very hot days.',
 'But implementation of existing HAPs has been uneven, according to a report from the Center for Policy Research. Many lack adequate funding, it found. And their triggering thresholds often are not customized to the local climate. In some areas, high daytime temperatures alone might serve as an adequate trigger for alerts. But in other places, nighttime temperatures or humidity might be as important a gauge of risk as daytime highs.',
 'Mumbai’s April heat stroke deaths highlighted the need for more nuanced and localized warnings, researchers say. That day’s high temperature of roughly 36°C was 1°C shy of the heat wave alert threshold for coastal cities set by national meteorological authorities. But the effects of the heat were amplified by humidity—an often neglected factor in heat alert systems—and the lack of shade at the late-morning outdoor ceremony.',
 'To help improve HAPs, urban planner Kotharkar’s team is working on a model plan that outlines best practices and could be adapted to local conditions. Among other things, she says, all cities should create a vulnerability map to help focus responses on the populations most at risk.',
 'Such mapping doesn’t need to be complex, Kotharkar says. “A useful map can be created by looking at even a few key parameters.” For example, neighborhoods with a large elderly population or informal dwellings that cope poorly with heat could get special warnings or be bolstered with cooling centers. The Nagpur project has already created a risk and vulnerability map, which enabled Kotharkar to tell officials which neighborhoods to focus on in the event of a heat wave this summer.',
 'HAPs shouldn’t just include short-term emergency responses, researchers say, but also recommend medium- to long-term measures that could make communities cooler. In Nagpur, for example, Kotharkar’s team has been able to advise city officials about where to plant trees to provide shade. HAPs could also guide efforts to retrofit homes or modify building regulations. “Reducing deaths in an emergency is good target to have, but it’s the lowest target,” says climate researcher Chandni Singh.'
 ],[
 question(31,'According to Paragraph 1, Nagpur’s plan proposes measures to _____.',['tackle extreme weather','ensure construction quality','monitor emergency warnings','address excessive workloads'],'A',0,'首段列举高温病房和炎热天气让工人休息，都是应对极端高温的措施。'),
 question(32,'One problem with existing HAPs is that they _____.',['prove too costly to be implemented','lack localized allert-issuing criteria','give delayed responses to heat waves','keep hospitals under great pressure'],'B',1,'第二段指出 triggering thresholds 未按当地气候定制，即缺少本地化的预警发布标准。原卷选项把 alert 拼作 allert，此处照录。'),
 question(33,'Mumbai’s case shows that India’s heat alert systems need to _____.',['include other factors besides temperature','take subtle weather changes into account','prioritize potentially disastrous heat waves','draw further support from local authorities'],'A',2,'第三段说气温未达到阈值，但湿度和缺少遮阴放大影响，因此应考虑气温以外的因素。'),
 question(34,'Kotharkar holds that a vulnerability map can help _____.',['prevent the harm of high humidity','target areas needing special attention','expand the Nagpur project’s coverage','make relief plans for heat-stricken people'],'B',4,'第四、五段说明地图帮助识别最危险人群及应重点关注的社区。'),
 question(35,'According to the last paragraph, researchers suggest that HAPs should _____.',['focus more on the heatstroke treatment','invite wider public participation','apply for more government grants','serve a broader range of purposes'],'D',5,'末段建议从短期应急扩展到种树、房屋改造和建筑规定，服务更广泛的长期目标。')
 ]),
 lesson(4,'人们走出来的路与城市规划','城市与生活',
 '文章介绍人们为方便通行自然形成的“愿望路径”，讨论它们如何反映集体选择，以及与正式城市规划之间的张力。大学铺路和百老汇历史的例子，展现这些路径被吸收和认可的过程。',
 ['定义自然形成的捷径与集体选择','大学通过真实行走路线完善路径','正式规划与使用者偏好之间的冲突','历史路径演变为百老汇','网络社群分享相关故事','人与动物共同展现自主开辟路线的倾向'],
 [('先读懂 desire paths 的定义','首段的 shortcuts、cut corners 与 most effectively 一起解释这个概念。'),('区分案例中的不同态度','大学铺路、要求走指定道路的标志，分别表达怎样的规划立场。'),('历史叙事抓住变化主线','原住民路径、贸易道路和百老汇名称变化，服务于同一个论点。')],
 [
 'Navigating beyond the organised pavements and parks of our urban spaces, desire paths are the unofficial footprints of a community, revealing the unspoken preferences, shared shortcuts and collective choices of humans. Often appearing as trodden dirt tracks through otherwise neat green spaces, these routes of collective disobedience cut corners, bisect lawns and cross hills, representing the natural capability of people (and animals) to go from point A to point B most effectively.',
 'Urban planners interpret desire paths as more than just convenient shortcuts; they offer valuable insights into the dynamics between planning and behaviour. Ohio State University allowed its students to navigate the Oval, a lawn in the centre of campus, freely, then proceeded to pave the desire paths, creating a web of effective routes students had established.',
 'Yet, reluctance persists among other planners to integrate desire paths into formal plans, citing concerns about safety, environmental impact, or primarily, aesthetics. A Reddit webpage devoted to the phenomenon, boasting nearly 50,000 members, showcases images of local desire paths adorned with signs instructing pedestrians to adhere to designated walkways, underscoring the rebellious nature inherent in these human-made tracks. This clash highlights an ongoing struggle between the organic, user-driven evolution of public spaces and the desire for a visually curated and controlled urban environment.',
 'The Wickquasgeck Trail is an example of a historical desire path, created by Native Americans to cross the forests of Manhattan and move between settlements quickly. This trail, when Dutch colonists arrived, was widened and made into one of the main trade roads across the island, known at the time as de Heere Straat, or Gentlemen’s Street. Following the British assumption of control in New York, the street was renamed Broadway. Notably, Broadway stands out as one of the few areas in NYC that defies the grid-based system applied to the rest of the city, cutting a diagonal across parts of the city.',
 'In online spaces, desire paths have sparked a fascination that can approach obsession, with the Reddit page serving as a hub. Contributors offer a wide array of stories, from little-known new shortcuts to long-established alternate routes.',
 'Animal desire paths, such as ducks forging trails through frozen ponds or dogs carving direct routes in gardens, highlight the adaptability of these trails in both human and animal experiences. As desire paths criss-cross through both physical and virtual landscapes, they stand as a proof of the collective insistence on forging unconventional routes and embracing the spirit of communal choice.'
 ],[
 question(36,'According to Paragraph 1, desire paths are a result of _____.',['the curiosity to explore surrounding hills','the necessity to preserve green spaces','the tendency to pursue convenience','the wish to find comfort in solitude'],'C',0,'首段说人和动物自然倾向于以最有效的方式从 A 点到 B 点，体现追求便利。'),
 question(37,'It can be inferred that Ohio State University _____.',['intends to improve its desire paths','leads in the research on desire paths','guides the creation of its desire paths','takes a positive view of desire paths'],'D',1,'第二段说学校允许学生自由行走，再把自然形成的路线铺好，体现积极认可。'),
 question(38,'The images on the Reddit webpage reflect _____.',['conflicting opinions on the use of desire paths','the call to upgrade the designing of public spaces','the demand for proper planning of desire paths','growing concerns over the loss of public spaces'],'A',2,'图片中的自然路径与要求走指定道路的标志并存，体现使用者和规划者之间的冲突。'),
 question(39,'The example of the Wickquasgeck Trail illustrates _____.',['the growth of New York City','the Dutch origin of desire paths','the importance of urban planning','the recognition of desire paths'],'D',3,'历史路径被加宽成为贸易道路并延续为百老汇，说明自然路径得到认可和沿用。'),
 question(40,'It can be learned from the last paragraph that desire paths _____.',['reveal humans’ deep respect for nature','are crucial to humans’ mental well-being','are a human imitation of animal behaviour','show a shared trait in humans and animals'],'D',5,'末段同时举鸭、狗与人类的路线，强调共同的自主选择和开辟捷径倾向。')
 ])]

lessons[1]['topic']='公共服务与社会'
lessons[2]['topic']='环境与公共政策'
lessons[1]['questions'][4]['answer']=None
lessons[1]['questions'][4]['answerStatus']='disputed'
lessons[1]['questions'][4]['referenceAnswer']=3
lessons[1]['questions'][4]['explanation']='资料参考答案为 D，本题暂不计分。原文末段已说明地方领导更了解居民需求，并追问哪些职能应交给地方；这为 C（在医疗体系中发挥更大作用）提供了推断依据。请结合末段比较 C 与 D 的区别，待参考答案进一步复核。'
for l in lessons:
    assert len(l['questions'])==5 and len(l['paragraphs'])==len(l['structure'])
    assert len(l['tips'])==3 and all(len(p['en'])>20 for p in l['paragraphs'])
    for q in l['questions']:
        assert len(q['options'])==4 and (q['answer'] is None or 0<=q['answer']<4)
        assert 0<=q['evidence']<len(l['paragraphs'])
out=Path(__file__).resolve().parents[1]/'src/past-2025.json'
out.write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
print(f'Wrote 4 passages, 20 questions, {sum(len(l["paragraphs"]) for l in lessons)} paragraphs to {out}')
