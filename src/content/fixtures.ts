/**
 * Replaceable development fixtures. These are imported only by the seed command.
 * Public pages read the persisted repository so edits made in the admin are shared.
 * Portfolio entries are fictional concepts and must retain their visible demo label.
 */
import type { BlogInput, PortfolioInput } from '@/lib/validation';

export const articleSeeds: (BlogInput & { id: string })[] = [
  {
    id: 'blog-measurement', slug: 'before-you-measure-decide-what-matters',
    title: { en: 'Before you measure, decide what matters.', fa: 'پیش از سنجش، مشخص کنید چه چیزی مهم است.' },
    excerpt: { en: 'A useful marketing report starts with a decision, not a dashboard. Here is a practical way to choose measurements your team can act on.', fa: 'گزارش مفید بازاریابی از یک تصمیم شروع می‌شود، نه از داشبورد. چطور معیارهایی انتخاب کنیم که تیم بتواند بر اساس آن‌ها اقدام کند؟' },
    category: { en: 'Strategy & measurement', fa: 'استراتژی و سنجش' }, author: 'Salsal / صلصال', cover: '', published: true,
    seoTitle: { en: 'Choose marketing measures that support decisions | Salsal', fa: 'انتخاب معیارهای بازاریابی برای تصمیم بهتر | صلصال' },
    seoDescription: { en: 'Define a business question, connect it to customer actions, and build a simple measurement plan before your next marketing campaign.', fa: 'پیش از کمپین بعدی، پرسش کسب‌وکار را تعریف کنید، آن را به اقدام مشتری پیوند دهید و برنامه سنجش ساده‌ای بسازید.' },
    content: {
      en: `A marketing report can contain dozens of numbers and still leave a team unsure what to do next. Before choosing charts, write down the decision the report should support. “Should we invest more in this campaign?” is more useful than “How did marketing perform?” because it asks for an actionable answer.

Start with the business question, then work backward to the customer action. If the objective is to create qualified conversations, a submitted form is only one part of the picture. Agree on what makes an inquiry relevant, who reviews it, and when the team records the outcome. The definition matters as much as the tracking.

Separate activity from response and outcome. Publishing four videos describes activity. Watching, saving, or clicking describes a response. A relevant inquiry or a completed purchase may describe an outcome. Each layer helps explain the next, but they should not be treated as interchangeable evidence of success.

Keep the first measurement plan small. Choose one primary outcome, a few supporting signals, and a review period. Write down the source of each number and any limitations. If the same person can submit twice, or if offline conversations are not recorded, that uncertainty belongs beside the result rather than in a footnote nobody reads.

Establish a baseline before changing the work. A comparison is easier to interpret when the time window, audience, and definitions remain consistent. If a campaign changes alongside pricing, availability, or seasonality, document those changes. Measurement can inform a decision without proving that one marketing action caused every movement.

Finish each review with a decision log: what we observed, what we think it means, what we will change, and when we will review it again. A modest report that leads to a clear next experiment is more useful than a polished dashboard that no one acts on.`,
      fa: `گزارش بازاریابی ممکن است ده‌ها عدد داشته باشد اما تیم هنوز نداند قدم بعدی چیست. پیش از انتخاب نمودار، تصمیمی را بنویسید که گزارش قرار است به آن کمک کند. «آیا روی این کمپین بیشتر سرمایه‌گذاری کنیم؟» از «بازاریابی چطور پیش رفت؟» مفیدتر است، چون پاسخی قابل‌اجرا می‌خواهد.

از پرسش کسب‌وکار شروع کنید و به اقدام مشتری برسید. اگر هدف، ایجاد گفت‌وگوی مرتبط است، ارسال فرم فقط بخشی از ماجراست. توافق کنید چه درخواستی مرتبط محسوب می‌شود، چه کسی آن را بررسی می‌کند و نتیجه چه زمانی ثبت می‌شود. تعریف معیار به اندازه ثبت داده اهمیت دارد.

فعالیت، واکنش و نتیجه را جدا ببینید. انتشار چهار ویدئو یک فعالیت است. تماشا، ذخیره یا کلیک واکنش محسوب می‌شود. درخواست مرتبط یا خرید تکمیل‌شده می‌تواند نتیجه باشد. هر لایه به توضیح لایه بعد کمک می‌کند، اما این‌ها شواهد هم‌ارز موفقیت نیستند.

برنامه اولیه سنجش را کوچک نگه دارید. یک نتیجه اصلی، چند نشانه پشتیبان و یک دوره بررسی انتخاب کنید. منبع هر عدد و محدودیتش را بنویسید. اگر یک نفر می‌تواند دو بار فرم بفرستد یا گفت‌وگوی تلفنی ثبت نمی‌شود، این ابهام باید کنار نتیجه دیده شود.

پیش از تغییر کار، وضعیت پایه را ثبت کنید. وقتی بازه زمانی، مخاطب و تعریف‌ها ثابت باشند، مقایسه قابل‌فهم‌تر است. اگر هم‌زمان قیمت، موجودی یا شرایط فصلی تغییر کرده، آن را هم ثبت کنید. سنجش می‌تواند به تصمیم کمک کند، بدون آنکه ثابت کند یک اقدام بازاریابی علت همه تغییرها بوده است.

هر بررسی را با ثبت تصمیم تمام کنید: چه دیدیم، برداشت ما چیست، چه چیزی را تغییر می‌دهیم و چه زمانی دوباره بررسی می‌کنیم. گزارشی ساده که به آزمایش بعدی روشن منجر شود، از داشبورد زیبایی که کسی بر اساس آن عمل نمی‌کند مفیدتر است.`
    },
  },
  {
    id: 'blog-content', slug: 'a-calendar-is-not-a-content-strategy',
    title: { en: 'A calendar is not a content strategy.', fa: 'تقویم، همان استراتژی محتوا نیست.' },
    excerpt: { en: 'Before filling the next month with posts, define the audience questions, editorial choices, and production rhythm behind the work.', fa: 'پیش از پر کردن ماه بعد با پست، پرسش مخاطب، انتخاب‌های تحریریه و ریتم تولید پشت محتوا را روشن کنید.' },
    category: { en: 'Content & social', fa: 'محتوا و شبکه‌های اجتماعی' }, author: 'Salsal / صلصال', cover: '', published: true,
    seoTitle: { en: 'Build a content strategy before a publishing calendar | Salsal', fa: 'ساخت استراتژی محتوا پیش از تقویم انتشار | صلصال' },
    seoDescription: { en: 'Connect audience questions, content pillars, formats, and team capacity before planning your next social publishing calendar.', fa: 'پیش از برنامه‌ریزی تقویم انتشار، پرسش مخاطب، ستون‌های محتوا، قالب‌ها و ظرفیت تیم را به هم پیوند دهید.' },
    content: {
      en: `A full publishing calendar can make a team feel organized while hiding an unanswered question: why should someone care about this content? A calendar is a useful scheduling tool. Strategy explains who the work is for, what it helps them understand, and why your brand has a useful contribution to make.

Begin with a small set of real audience questions. Use customer conversations, sales notes, support requests, and the language people use when describing their problem. Group these questions by the decisions they support. A person discovering a problem needs a different kind of content from someone comparing suppliers or preparing to buy.

Choose editorial pillars that are specific enough to guide a decision. “Education” can include almost anything. “Helping studio owners choose a practical booking workflow” tells a writer what belongs and what does not. A strong pillar connects a recurring audience need with a perspective your brand can sustain.

Match the format to the idea. A visual demonstration may become a short video. A sequence of decisions may suit a carousel. A complex explanation may deserve a website article that social posts introduce. Repurpose the central idea, but adapt the opening, detail, and next action to the context of each channel.

Plan for your real production capacity. Name the person responsible for each stage: brief, production, review, publication, and response. Leave room for corrections and unexpected questions. It is better to sustain a considered rhythm than to commit to a volume that forces every piece into a rush.

Only then build the calendar. Review it for balance across audience needs, formats, and customer stages. After publishing, look for useful responses and recurring questions. The next calendar should reflect what the team learned, not simply repeat the same empty slots with new titles.`,
      fa: `تقویم انتشار پر می‌تواند به تیم احساس نظم بدهد، در حالی که یک پرسش بی‌پاسخ مانده است: چرا مخاطب باید به این محتوا اهمیت بدهد؟ تقویم ابزار زمان‌بندی است. استراتژی توضیح می‌دهد محتوا برای چه کسی ساخته می‌شود، به فهم چه چیزی کمک می‌کند و برند چه حرف مفیدی دارد.

از چند پرسش واقعی مخاطب شروع کنید. گفت‌وگوی مشتری، یادداشت فروش، درخواست پشتیبانی و واژه‌هایی که مردم برای بیان مسئله‌شان به کار می‌برند، نقطه شروع خوبی هستند. پرسش‌ها را بر اساس تصمیمی که پشتیبانی می‌کنند دسته‌بندی کنید. کسی که تازه مسئله را شناخته با کسی که تأمین‌کننده مقایسه می‌کند نیاز یکسانی ندارد.

ستون‌های محتوایی را آن‌قدر مشخص انتخاب کنید که به تصمیم کمک کنند. «آموزش» تقریباً هر چیزی را در بر می‌گیرد. «کمک به صاحبان استودیو برای انتخاب روش عملی رزرو» به نویسنده می‌گوید چه چیزی داخل موضوع است و چه چیزی نیست. ستون خوب، نیاز تکرارشونده مخاطب را به نگاه پایدار برند پیوند می‌دهد.

قالب را با ایده هماهنگ کنید. نمایش بصری شاید ویدئوی کوتاه بخواهد، ترتیب تصمیم‌ها کاروسل و توضیح پیچیده مقاله‌ای در سایت که شبکه اجتماعی آن را معرفی کند. ایده اصلی را بازاستفاده کنید، اما شروع، جزئیات و اقدام بعدی را برای فضای هر کانال بازطراحی کنید.

برای ظرفیت واقعی تولید برنامه بریزید. مسئول هر مرحله، از شرح محتوا تا تولید، بازبینی، انتشار و پاسخ‌گویی را مشخص کنید. برای اصلاح و پرسش پیش‌بینی‌نشده جا بگذارید. ریتم سنجیده و پایدار بهتر از حجمی است که هر قطعه محتوا را عجولانه می‌کند.

حالا تقویم را بسازید. تعادل نیاز مخاطب، قالب‌ها و مراحل تصمیم‌گیری را بررسی کنید. پس از انتشار، واکنش‌های مفید و پرسش‌های تکراری را ببینید. تقویم بعد باید آموخته‌های تیم را نشان دهد، نه اینکه همان خانه‌های خالی را با عنوان‌های تازه پر کند.`
    },
  },
  {
    id: 'blog-website', slug: 'make-the-next-step-clearer',
    title: { en: 'Your website should make the next step clearer.', fa: 'وب‌سایت باید قدم بعدی را روشن‌تر کند.' },
    excerpt: { en: 'An attractive page is a beginning. A useful experience helps people understand the offer, find evidence, and act with confidence.', fa: 'صفحه زیبا یک شروع است. تجربه مفید کمک می‌کند مخاطب پیشنهاد را بفهمد، شاهد مناسب پیدا کند و با اطمینان اقدام کند.' },
    category: { en: 'Digital experiences', fa: 'تجربه‌های دیجیتال' }, author: 'Salsal / صلصال', cover: '', published: true,
    seoTitle: { en: 'Design a website around a clearer next step | Salsal', fa: 'طراحی وب‌سایت حول یک قدم بعدی روشن | صلصال' },
    seoDescription: { en: 'Review your website through the visitor’s questions: what you offer, who it is for, why it matters, and what happens after they act.', fa: 'وب‌سایت را از نگاه پرسش‌های بازدیدکننده بررسی کنید: پیشنهاد چیست، برای چه کسی است، چرا مهم است و پس از اقدام چه می‌شود؟' },
    content: {
      en: `When reviewing a website, it is easy to start with color, typography, and animation. Those details matter, but they serve a more basic task: helping a visitor understand where they are and what they can do next. A beautiful interface cannot resolve an unclear offer by itself.

Read the first screen as someone unfamiliar with your company. Can you describe the offer in one sentence? Is it clear who the service is for? Does the supporting text explain a useful difference, or repeat broad claims such as quality and innovation? Replace vague statements with concrete information a prospective customer can evaluate.

Let the page answer questions in a sensible order. Explain the problem and offer, show how the work happens, provide relevant evidence, then invite an appropriate action. Not every visitor is ready for a sales call. A service page, case study, or helpful article can be a valuable next step when it reduces uncertainty.

Make calls to action describe what happens. “Discuss your project” creates a different expectation from “Get an instant quote.” The destination must keep that promise. If a form starts a conversation, say so; do not imply that submitting it produces pricing or a confirmed appointment unless the system actually does that.

Review the form as part of the experience. Ask only for information the team will use. Explain optional fields, provide understandable errors, and confirm successful submission. On a small screen, check that labels remain visible, controls are usable, and a visitor can reach the same important information as on desktop.

Finally, test a few real journeys from beginning to end. Ask someone to find a suitable service, understand the process, and send an inquiry. Watch where they hesitate. Their uncertainty is often a more useful design brief than a request to make the page feel more modern.`,
      fa: `هنگام بررسی وب‌سایت، شروع از رنگ، تایپوگرافی و حرکت آسان است. این جزئیات مهم‌اند، اما در خدمت کاری پایه‌ای قرار دارند: کمک به بازدیدکننده برای فهمیدن اینکه کجاست و قدم بعدی چیست. رابط زیبا به‌تنهایی پیشنهاد مبهم را روشن نمی‌کند.

صفحه اول را از نگاه کسی بخوانید که شرکت را نمی‌شناسد. می‌توانید پیشنهاد را در یک جمله توضیح دهید؟ معلوم است خدمت برای چه کسی است؟ متن پشتیبان تفاوت کاربردی را توضیح می‌دهد یا ادعاهای کلی کیفیت و نوآوری را تکرار می‌کند؟ جمله‌های مبهم را با اطلاعاتی جایگزین کنید که مشتری بتواند ارزیابی کند.

بگذارید صفحه به ترتیب منطقی پاسخ بدهد. مسئله و پیشنهاد را توضیح دهید، روش کار را نشان دهید، شاهد مرتبط ارائه کنید و سپس به اقدام مناسب دعوت کنید. همه آماده تماس فروش نیستند. صفحه خدمت، نمونه کار یا مقاله مفید وقتی ابهام را کم کند، قدم بعدی ارزشمندی است.

دکمه دعوت به اقدام باید اتفاق بعد را توضیح دهد. «درباره پروژه صحبت کنیم» انتظار متفاوتی از «دریافت قیمت فوری» می‌سازد. صفحه مقصد باید به همین وعده وفادار باشد. اگر فرم آغاز گفت‌وگوست، همین را بگویید؛ دریافت قیمت یا تأیید جلسه را القا نکنید مگر اینکه سامانه واقعاً آن را انجام دهد.

فرم را بخشی از تجربه بدانید. فقط اطلاعاتی را بخواهید که تیم استفاده می‌کند. فیلد اختیاری، خطای قابل‌فهم و تأیید ارسال موفق را در نظر بگیرید. در صفحه کوچک بررسی کنید برچسب‌ها دیده شوند، کنترل‌ها قابل‌استفاده باشند و اطلاعات مهم به اندازه نسخه دسکتاپ در دسترس بماند.

در پایان، چند مسیر واقعی را از ابتدا تا انتها امتحان کنید. از کسی بخواهید خدمت مناسب را پیدا کند، فرایند را بفهمد و درخواست بفرستد. محل مکث او را ببینید. این ابهام‌ها اغلب شرح مسئله طراحی مفیدتری از درخواست «مدرن‌تر شدن صفحه» هستند.`
    },
  },
];

export const portfolioSeeds: (PortfolioInput & { id: string })[] = [
  {
    id: 'portfolio-forma', slug: 'forma-brand-experience', client: 'Forma',
    title: { en: 'A quieter kind of presence.', fa: 'حضوری آرام‌تر و ماندگار.' },
    industry: { en: 'Architecture & interiors', fa: 'معماری و فضای داخلی' },
    services: ['web-development', 'photography', 'seo'], cover: '', gallery: [], date: '2026-08-18',
    challenge: { en: 'Fictional concept brief: an architecture studio needs a digital presence that makes the thinking behind its spaces as clear as the finished work. The challenge is to show detail and restraint while giving prospective clients a practical way to understand the studio and begin a conversation.', fa: 'شرح پروژه مفهومی: یک استودیوی معماری به حضوری دیجیتال نیاز دارد که فکر پشت فضاهایش را به روشنی نتیجه نهایی نشان دهد. چالش، نمایش جزئیات و سادگی در کنار مسیری کاربردی برای شناخت استودیو و شروع گفت‌وگوست.' },
    approach: { en: 'The concept starts with an editorial structure: a short introduction, a considered project index, and case studies built around context, materials, and decisions. The visual direction pairs warm neutral tones with generous space and a disciplined image hierarchy.', fa: 'طرح از یک ساختار تحریریه آغاز می‌شود: معرفی کوتاه، فهرست سنجیده پروژه‌ها و روایت‌هایی حول زمینه، متریال و تصمیم‌ها. جهت بصری، رنگ‌های خنثی گرم را با فضای تنفس و سلسله‌مراتب منظم تصویر همراه می‌کند.' },
    solution: { en: 'A responsive website direction, a photography brief for spaces and material details, and a search-friendly content model. Project templates bring the brief, approach, and selected images together, while a concise inquiry flow gives visitors a clear next step.', fa: 'طرح وب‌سایت واکنش‌گرا، شرح عکاسی فضا و جزئیات متریال و مدل محتوای سازگار با جست‌وجو. قالب پروژه، مسئله و رویکرد را کنار تصاویر منتخب می‌گذارد و فرم درخواست کوتاه، قدم بعدی را روشن می‌کند.' },
    result: { en: 'Intended outcome: a coherent digital identity that helps visitors understand the studio’s approach and make a relevant inquiry. This is an illustrative design concept; it was not launched for a client and no performance results are claimed.', fa: 'نتیجه مورد انتظار: هویت دیجیتال منسجمی که شناخت رویکرد استودیو و ارسال درخواست مرتبط را ساده کند. این کار یک طرح نمایشی است؛ برای مشتری اجرا نشده و ادعای نتیجه عملکردی ندارد.' },
  },
  {
    id: 'portfolio-orbit', slug: 'orbit-connected-launch', client: 'Orbit',
    title: { en: 'A launch with every piece in place.', fa: 'شروعی با همه اجزا در جای درست.' },
    industry: { en: 'Technology & collaboration', fa: 'فناوری و همکاری' },
    services: ['digital-marketing', 'web-development', 'social-media'], cover: '', gallery: [], date: '2026-09-08',
    challenge: { en: 'Fictional concept brief: a team collaboration product needs to explain a focused benefit in a crowded category. The launch must connect the product story, website, and social content without overwhelming visitors with a long feature list.', fa: 'شرح پروژه مفهومی: یک محصول همکاری تیمی باید مزیت مشخص خود را در بازاری شلوغ توضیح دهد. شروع معرفی باید روایت محصول، وب‌سایت و محتوای اجتماعی را به هم وصل کند، بدون اینکه مخاطب زیر فهرست قابلیت‌ها گم شود.' },
    approach: { en: 'We frame the concept around one useful promise: making the next shared action visible. The proposed journey moves from a familiar coordination problem to a simple product explanation, then into use cases and a clear invitation to explore.', fa: 'مفهوم حول یک وعده کاربردی شکل می‌گیرد: روشن کردن اقدام مشترک بعدی. مسیر پیشنهادی از مسئله آشنای هماهنگی شروع می‌شود، به توضیح ساده محصول می‌رسد و با کاربردها و دعوت روشن به کاوش ادامه پیدا می‌کند.' },
    solution: { en: 'A positioning outline, responsive launch-page direction, coordinated social content themes, and a first-party measurement brief. The visual system uses precise typography and connected forms to reinforce the product’s role in bringing work together.', fa: 'چارچوب جایگاه‌یابی، طرح صفحه معرفی واکنش‌گرا، موضوع‌های هماهنگ محتوای اجتماعی و برنامه سنجش داده‌های مستقیم. تایپوگرافی دقیق و فرم‌های پیوسته، نقش محصول در کنار هم آوردن کار را تقویت می‌کنند.' },
    result: { en: 'Intended outcome: a launch system in which each channel explains the same benefit and supports the next customer question. This concept demonstrates an approach, not an actual product launch, conversion uplift, or client engagement.', fa: 'نتیجه مورد انتظار: سیستم معرفی‌ای که در آن هر کانال همان مزیت را توضیح می‌دهد و به پرسش بعدی مخاطب پاسخ می‌دهد. این طرح نمایش رویکرد است، نه معرفی واقعی محصول، افزایش نرخ تبدیل یا پروژه مشتری.' },
  },
  {
    id: 'portfolio-navaa', slug: 'navaa-everyday-stories', client: 'Navaa',
    title: { en: 'Everyday moments. A distinct point of view.', fa: 'لحظه‌های روزمره، با نگاهی متمایز.' },
    industry: { en: 'Lifestyle & objects', fa: 'سبک زندگی و اشیای کاربردی' },
    services: ['instagram-marketing', 'photography', 'videography', 'video-editing'], cover: '', gallery: [], date: '2026-09-22',
    challenge: { en: 'Fictional concept brief: a lifestyle label needs a visual story that connects everyday objects to the rituals around them. The work should show product detail while avoiding a repetitive feed of isolated catalog images.', fa: 'شرح پروژه مفهومی: یک برند سبک زندگی به روایت تصویری نیاز دارد که اشیای روزمره را به عادت‌های اطرافشان پیوند دهد. کار باید جزئیات محصول را نشان دهد، بدون تکرار عکس‌های جداافتاده کاتالوگی.' },
    approach: { en: 'The proposed editorial direction follows three themes: the object, the making, and the moment of use. A shared treatment for light, composition, and pacing lets photography and short films feel like parts of the same collection.', fa: 'جهت تحریریه پیشنهادی سه موضوع را دنبال می‌کند: شیء، ساخت و لحظه استفاده. شیوه مشترک نور، ترکیب‌بندی و ریتم کمک می‌کند عکس و فیلم کوتاه اجزای یک مجموعه به نظر برسند.' },
    solution: { en: 'A social content strategy, a coordinated photo and video shot plan, and a set of proposed Reels and carousel formats. The production brief anticipates vertical and square crops, captions, and a manageable publishing rhythm.', fa: 'استراتژی محتوای اجتماعی، برنامه هماهنگ عکاسی و فیلم‌برداری و مجموعه قالب پیشنهادی ریلز و کاروسل. شرح تولید، برش عمودی و مربعی، زیرنویس و ریتم انتشار قابل‌مدیریت را از ابتدا در نظر می‌گیرد.' },
    result: { en: 'Intended outcome: a recognizable visual library with enough variety to support a sustained content program. This is a fictional creative direction; no real photography commission, audience growth, or sales outcome is represented.', fa: 'نتیجه مورد انتظار: کتابخانه تصویری قابل‌شناسایی با تنوع کافی برای برنامه محتوای پایدار. این یک جهت‌گیری خلاقانه فرضی است و سفارش عکاسی واقعی، رشد مخاطب یا نتیجه فروش را نشان نمی‌دهد.' },
  },
];
