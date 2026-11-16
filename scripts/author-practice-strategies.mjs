import fs from 'node:fs/promises';
import {lessons} from '../src/content.js';
import {validateStrategy} from '../src/core.js';
const out={};
function add(id,n,type,anchors,locate,evidence,reasoning,options){
 const lesson=lessons.find(l=>l.id===id),q=lesson.questions[n-1];
 const guide={type,anchors:anchors.map(([text,meaning])=>({text,meaning})),locate,evidence:evidence.map(([paragraph,quote,meaning])=>({paragraph,quote,meaning})),reasoning,options:options||q.optionNotes};
 out[id+'-q'+n]=validateStrategy(guide,lesson.paragraphs);
}
add('reading-habit',1,'原因',[['remain closed','仍然合着'],['conditions','条件']],
 '题干已指向第一段。圈 remain closed，在原文找到同样的两个词，向后读 The problem 开头的解释句即可。',
 [[0,'The problem is often the size of the plan: it requires conditions that are difficult to create every day.','计划太大，需要每天都难以凑齐的条件。']],
 '冒号后直接解释问题。认出 difficult（困难）与 conditions（条件），就能把 demanding conditions（苛刻条件）对应到原句，保留 B。');
add('reading-habit',2,'目的',[['breakfast table','早餐桌'],['reminder','提醒物']],
 '圈题干 breakfast table，到第二段找同词。读它后面一句，看书放在那里产生什么作用，后面的忙闲两种早晨可暂时跳过。',
 [[1,'the book itself becomes a reminder.','书本身成了提醒。']],
 '原句 reminder 是“提醒物”，选项 remind 是“提醒”。两者共享 remind 字形，名词换成动词，目的对应 C。');
add('reading-habit',3,'细节定位',[['record','记录'],['understanding','理解']],
 '第三段反复出现 record。先读 Yet 后对记录的要求，再读末句 because 后的原因，比较作者看重的是打卡数量还是阅读效果。',
 [[2,'Yet a record is useful only when it supports the activity.','记录只有支持阅读活动时才有用。'],[2,'because it directs attention toward understanding.','因为它把注意力引向理解。']],
 '把 supports 与 understanding 两个词拼回目标：记录应帮助理解。A 的 support understanding 对上两处词；其他项新增数量、分享或速度要求。');
add('reading-habit',4,'词义',[['stable','稳定的'],['regular contact','经常接触']],
 '题干给出末段和 stable，直接找最后一句。往前看 regular contact，借助“经常接触书本”判断这里说的是怎样的位置。',
 [[3,'regular contact with books makes them more likely.','经常接触书本，让这些联系更容易出现。'],[3,'The practical goal is to give reading a stable place in ordinary life.','实际目标是让阅读在日常生活里占据稳定的位置。']],
 'regular 表示经常、规律；这里的 stable 延续“长期有固定位置”的意思。steady 是稳定，temporary 是暂时，先用这组相反意思完成筛选。',
 ['expensive 是昂贵，本段谈阅读与生活的联系，没有以花费解释 stable。','private 是私人的，原句强调阅读持续存在，没有讨论是否对外公开。','temporary 是暂时的，与 regular contact 的持续、规律方向相反。','steady 是稳定的，符合“阅读在日常生活中有固定位置”的语境。']);
add('reading-habit',5,'主旨',[['smaller plan','更小的计划'],['regular reading habit','规律阅读习惯']],
 '标题题留到最后。首段看 plan 太大带来的问题，第二段看 smaller plan 的办法，末段看 regular reading habit，连接这三个短语。',
 [[1,'A smaller plan can be easier to repeat.','小计划更容易重复执行。'],[3,'The practical goal is to give reading a stable place in ordinary life.','目标是让阅读稳定地融入日常生活。']],
 'small 对应小计划，routines 对应规律习惯，last 对应稳定坚持。B 把方法和目标连在一起；价格、椅子只属于无关内容或开头细节。');

add('hybrid-work',1,'例证',[['two teams','两个团队'],['shared time','共同在场的时间']],
 '题干的 two teams 在首句。例子作用题先读对比后的总结，找 experiences differ because，看看差异归因于什么。',
 [[0,'Their experiences differ because they use shared time for different purposes.','感受不同，因为他们把共同在场的时间用于不同目的。']],
 'because 后给出例子的解释。只抓 use shared time，便能对应 C 的 use of shared time；三天只是共同条件，题目重点在怎样用这段时间。');
add('hybrid-work',2,'细节定位',[['designers','设计师'],['brief exchange','简短交流']],
 '圈 designers，在第二段找到它。读该句后半段的 brief exchange can，看 can 后面说交流帮助发现了什么。',
 [[1,'a brief exchange can reveal an assumption that everyone has overlooked.','简短交流能揭示大家先前忽略的一个假设。']],
 'reveal 对应 notice（发现），overlooked 对应 missed（漏掉）。把“发现＋原先忽略”两个部件对上，B 正好同时覆盖。');
add('hybrid-work',3,'原因',[['New employees','新员工'],['small question','小问题']],
 '找第三段 New employees，再看紧跟的一句。将 formal online meeting 与 small question 放在一起，观察小问题和正式会议的落差。',
 [[2,'They may hesitate to request a formal online meeting for a small question.','他们可能不愿为一个小问题申请正式线上会议。']],
 'hesitate 是犹豫，small question 是小问题。正式会议显得过于隆重，A 的 may not justify it 表示“可能觉得不值得专门开会”，保持了原句的可能语气。');
add('hybrid-work',4,'推断',[['physical presence alone','仅仅人在现场'],['questions are welcome','提问受到欢迎']],
 '按题干原词找第三段 physical presence alone。However 是转折路标，接着读后一句 must 和 need to 后的两个条件。',
 [[2,'Experienced workers must have time to respond, and newcomers need to feel that questions are welcome.','老员工要有时间回应，新人要觉得提问受到欢迎。']],
 'and 连接两项要求：有时间＋欢迎提问。D 的 available 对应 have time，welcoming 对应 welcome，两个条件都对齐。');
add('hybrid-work',5,'推断',[['Managers','管理者'],['adjusting its schedule','调整日程']],
 '问作者建议，先到末段找 Managers therefore。看它提出的问题，再读最后一句 adjusting its schedule，判断日程应该怎样处理。',
 [[3,'The answers may change as a project develops.','项目推进时，答案可能改变。'],[3,'Reviewing the quality of cooperation gives a team a stronger basis for adjusting its schedule than simply repeating a fixed rule.','检查合作质量，比重复固定规则更有助于调整日程。']],
 'change 和 adjusting 都指向调整。B 随工作需要改变日程，符合末段；A 的 permanent 和 C 的 only 把灵活判断收窄成固定规则。');

add('urban-trees',1,'例证',[['count equally','计数相同'],['pedestrians','行人']],
 '题干已限定首段比较。找小树与大树的句子，重点比较 count equally 与紧接的 value very different：数量一样，效果怎样？',
 [[0,'count equally in a planting total. Their immediate value to pedestrians can be very different.','在种植总数中都计作一棵，但对行人的实际价值可能很不同。']],
 'equally 与 different 构成对照。C 说总数会掩盖实际价值的差异，正好概括这组关系；其他项直接下达移除或选址命令。');
add('urban-trees',2,'原因',[['two streets','两条街'],['different needs','不同需求']],
 '圈 two streets，找第二段。两条街气温相近，读 but 后面的 overlook their different needs，再回看需求差在哪。',
 [[1,'One already has gardens and wide tree cover; the other has little shade and many people waiting outdoors.','一条街已有绿化树荫，另一条缺少遮阴却有很多人在户外等候。']],
 '只抓 one / the other 的对比：已有树荫与 little shade。B 的 unequal needs for additional shade 表示补充树荫的需求不同，原因直接吻合。');
add('urban-trees',3,'细节定位',[['smaller project','较小的项目'],['reliable maintenance','可靠养护']],
 '圈 smaller planting project，到第三段找 smaller project。读 with 后面的条件和 than 前的结果，确认“小项目更有效”附带什么条件。',
 [[2,'A smaller project with reliable maintenance may produce more useful shade over time','有可靠养护的小项目，长期可能产生更多有用的树荫。']],
 'with 后是关键条件。reliable＝dependable，maintenance＝care，over time 表示持续；A 的 dependable continuing care 把这几点换词表达。');
add('urban-trees',4,'词义',[['commitment','投入与责任'],['Roots need space','树根需要空间']],
 '直接找第三段 commitment。它后面连续列出树根、幼树、枝条需要什么，这些例子就是解释词义的线索。',
 [[2,'Roots need space, young trees need water, and damaged branches require attention.','树根需要空间，幼树需要水，受损枝条需要照料。']],
 'need、need、require 连续说明后续要做的事，long 又表示时间长。D 的 continuing responsibility 即持续责任，能把这组养护事项合起来。',
 ['sudden celebration 指突然的庆祝，后面列的是长期养护，时间和行为都不对应。','simple calculation 指简单计算，树根、浇水、枝条照料描述的是持续工作。','attractive photograph 指漂亮照片，既未出现在这段，也无法概括 need / require 列表。','continuing responsibility 指持续责任，能覆盖空间、浇水和照料等长期义务。']);
add('urban-trees',5,'态度',[['assessment','评估'],['busy walking routes','繁忙步行路线']],
 '题干问作者支持哪种指标，直接读末段 A thoughtful assessment。把 ask 后面三个 whether / how 的检查项目圈出。',
 [[3,'whether shade reaches busy walking routes, and whether the hottest neighborhoods receive lasting benefits.','检查树荫是否覆盖繁忙步行路线，最热街区是否持续受益。']],
 'C 的 lasting shade 和 busy routes 对应 lasting benefits、shade、busy walking routes。其余项只数公告、购买数量或仪式大小，没有检查使用效果。');

add('learning-ai',1,'细节定位',[['polished paragraph','润色好的段落'],['however','然而']],
 '题干限定首段。找到 polished paragraph 后，转到 however 所在句，读 reveals little about 后面的内容。',
 [[0,'The finished paragraph, however, reveals little about the thinking the student has done.','完成的段落很少能表明学生自己进行了多少思考。']],
 'about 后直接填出“无法看出的对象”：the thinking the student has done。C 的 student’s own thinking 是它的简化改写。');
add('learning-ai',2,'细节定位',[['In the second','在第二种方法中'],['original material','原始材料']],
 '圈 second method，读第二段 In the second 开始的长句。抓 writes、asks、checks 三个动作，重点看 checks 后如何核对建议。',
 [[1,'checks each suggestion against the original material.','对照原始材料逐条检查建议。']],
 'checks＝evaluate，original material＝source material。A 同时保留“评价建议”和“用原材料核对”；其他项跳过了先写或核查这两个动作。');
add('learning-ai',3,'原因',[['Fluent language','流畅的语言'],['evidence','证据']],
 '在第三段首句找 Fluent language。题目问为什么会误导，读下一句 while 后面缺少什么，先不看后面三个提问。',
 [[2,'A paragraph may connect sentences smoothly while leaving out a necessary piece of evidence.','句子可以衔接流畅，同时遗漏必要证据。']],
 'while 把“流畅”和“缺证据”放在一起。leaving out＝lack / hide a lack，evidence 两边相同，因此 B 的证据不足最贴合原因。');
add('learning-ai',4,'目的',[['independent tasks','独立任务'],['transfer','迁移']],
 '题干已指向末段，找 independent tasks。读 to check 后面的 this transfer，再向前一句找 this 指的具体能力。',
 [[3,'Can the student apply the same idea to a different problem and explain the result?','学生能否把同一想法用于另一个问题并解释结果？'],[3,'Teachers can design short independent tasks to check this transfer.','教师可用短独立任务检查这种迁移。']],
 'to check 直接给出目的；this transfer 指把知识换到不同问题上使用。D 保留 transfer learning，其他项关注次数、文风或出文速度。');
add('learning-ai',5,'态度',[['If so','如果可以'],['assistance','辅助']],
 '态度题先看结尾作者怎样评价工具。圈 If so，回看它的条件，再看 assistance has contributed，说的是怎样使用才有价值。',
 [[3,'If so, assistance has contributed to a skill that the learner can carry forward.','如果学生能独立迁移运用，辅助就促进了可以继续使用的技能。']],
 'has contributed 是肯定，If so 又附带学习条件。C 的 supportive of thoughtful use 同时包含支持和审慎使用，避免把有条件评价变成全盘肯定或否定。');

add('repair-economy',1,'例证',[['spare part','备件'],['identify the fault','识别故障']],
 '用题干 spare part 找首段末句。看 if 后面没人会做的两件事：识别故障和说明安装，这能解释便宜零件为什么仍可能没用。',
 [[0,'An affordable spare part is of little use if nobody can identify the fault or explain how to install it safely.','如果无人会诊断故障或安全安装，即使备件便宜也难以发挥作用。']],
 'identify 与 explain how 都是在说维修知识。A 的 knowledge needed to carry out a repair 概括这两项；价格不是此例要强调的缺口。');
add('repair-economy',2,'原因',[['final price is low','最终费用低'],['uncertainty','不确定性']],
 '题干 low repair price 对应第二段 final price is low。即使价格低，后半句仍会说明更换为何有吸引力，读 uncertainty 后的内容。',
 [[1,'Even when the final price is low, uncertainty about the process can make replacement attractive.','即便最终价格低，维修流程的不确定性仍可能让换新更有吸引力。']],
 'Even when 先承认便宜，主句再给真正原因 uncertainty。前句还有 waiting，合起来对应 C 的 uncertainty and delay。');
add('repair-economy',3,'细节定位',[['accessible components','易接近的零部件'],['Clear manuals','清楚的手册']],
 '找第三段两个原词，先看它们各自能帮助什么，再读 Together 开头的总结句，把设计和说明的共同效果合起来。',
 [[2,'these arrangements turn a general preference for repair into an option that can actually be used.','这些安排把维修从一般偏好变成真正可使用的选择。']],
 'actually be used 表示可以真正执行，对应 B 的 practical。A、D 把“更好维修”扩大成无需决策或永不损坏；C 把减少延误的方向反过来。');
add('repair-economy',4,'例证',[['old appliance','旧电器'],['different circumstances','不同情况']],
 '例子题已指定末段。找 old appliance，先读它前面一句 different circumstances，再看旧电器和近新电器比较的是哪种条件。',
 [[3,'A useful policy should also leave room for different circumstances.','有效政策要给不同情况留出余地。'],[3,'An old appliance that consumes large amounts of energy may deserve a different decision from a nearly new one with a minor fault.','高耗能旧电器与只有小故障的近新电器，可能需要不同决定。']],
 'different 重复两次，把段首观点和例子连起来。D 的 depend on circumstances 直接概括；A、B、C 都把具体权衡改成统一做法。');
add('repair-economy',5,'主旨',[['access to repair','维修可获得性'],['relevant information','相关信息']],
 '主旨题最后做。末段结尾用 When people have 列出理想条件，再回看前面几题是否分别涉及维修知识、流程和设计。',
 [[3,'When people have practical access to repair and relevant information, they can decide with greater confidence','当人们能实际获得维修服务和相关信息，就更能有把握地决定。']],
 'access 对应 accessible，information 对应 informed。A 同时容纳可维修的条件和知情决定，能够覆盖前面各段；其余项限定在单一因素或统一结论。');

add('privacy-choice',1,'目的',[['most visible button','最显眼的按钮'],['simply to continue','只是为了继续']],
 '题干的按钮在首段第二句出现。读按钮后面 simply to，to 后直接说明目的，再用首句 feature 确认要继续到哪里。',
 [[0,'they may press the most visible button simply to continue.','他们可能按最显眼的按钮，只是为了继续操作。']],
 'to continue 是目的，首句 wanted feature 是目标功能，B 的 get to the desired feature quickly 把两处合起来。点击行为本身没有证明认真读过。');
add('privacy-choice',2,'例证',[['location access','位置权限'],['right moment','恰当时机']],
 '圈 location，找第二段位置权限的例子。先读段首 at the right moment，再看例子说解释放在哪、解释什么，最后读段尾总结。',
 [[1,'A short explanation beside a request for location access can describe which feature needs it','在位置请求旁放短解释，说明哪个功能需要位置。'],[1,'make relevant information understandable where a decision occurs.','在决策发生处，让相关信息容易理解。']],
 'beside a request 是请求当下，which feature 是具体用途。C 的 specific 与 at the decision point 同时覆盖内容和时机。');
add('privacy-choice',3,'原因',[['Default settings','默认设置'],['keep them','保留它们']],
 '用 Default settings 找第三段首句。because 是现成的原因标记，只读后面 users 做什么，再用下一句核对修改为何不容易。',
 [[2,'Default settings deserve attention because busy users often keep them.','默认设置值得关注，因为忙碌用户常常保留它们。']],
 'keep them＝leave the initial choice unchanged，A 换了说法但动作一样。其他项讲逐条阅读、拒绝功能或时间无限，均偏离 keep 的意思。');
add('privacy-choice',4,'细节定位',[['meaningful choice','有意义的选择'],['revise','修改']],
 '在最后一段找 meaningful choice。读 includes 后具体包含什么，再读 Settings should be easy to find，确认修改途径是否方便。',
 [[3,'A meaningful choice therefore includes a practical way to revise an earlier decision.','有意义的选择应包括切实可行的方式来修改先前决定。']],
 'revise an earlier decision 几乎直接重现于 D；easy to find 支持 easily。B 的 permanently 固定不变，与 revise 的方向相反。');
add('privacy-choice',5,'主旨',[['understandable','容易理解'],['revise an earlier decision','修改先前决定']],
 '先看第二段最后一句和末段第二句：一处说信息怎样呈现，一处说决定之后能做什么。用这两条主线检查标题级概括。',
 [[1,'make relevant information understandable where a decision occurs.','让用户在作决定时能理解相关信息。'],[3,'a practical way to revise an earlier decision.','有切实可行的方式修改先前决定。']],
 'understandable 对应 clear，revise 对应 adjustable。B 同时覆盖“清楚地选”和“之后能改”，其余项删去选择、只加长文本或只数点击，范围都偏了。');
if(Object.keys(out).length!==30)throw Error('Expected 30 practice strategies');
await fs.writeFile(new URL('../src/strategies-practice.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
console.log('Wrote 30 original-exercise strategies with verified literal evidence.');
