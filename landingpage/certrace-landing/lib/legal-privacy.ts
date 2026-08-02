import { CONTACT_EMAIL } from "./content";
import type { LegalDoc } from "./legal";

export const PRIVACY_EN: LegalDoc = {
  eyebrow: "LEGAL",
  title: "Certrace Privacy Policy",
  effectiveLabel: "Effective Date",
  effective: "30 July 2026",
  updatedLabel: "Last Updated",
  updated: "30 July 2026",
  lede: "How Certrace collects, uses, discloses, and protects personal data, in accordance with Thailand's Personal Data Protection Act B.E. 2562 (2019).",
  contentsLabel: "ON THIS PAGE",
  sections: [
    {
      id: "applicability",
      heading: "1. Introduction and Applicability",
      blocks: [
        {
          p: "This Privacy Policy explains how Certrace, a company operating in Bangkok, Thailand (the “Company,” “Certrace,” “we,” “us,” or “our”) collects, uses, discloses, and protects personal data in connection with the Certrace platform for ESG data management and CBAM compliance support (the “Platform” or “Services”), in accordance with the Personal Data Protection Act B.E. 2562 (2019) of Thailand (“Thai PDPA”) and other applicable data protection laws.",
        },
        {
          p: "This Privacy Policy applies to personal data of (a) individuals who register for or use the Platform on behalf of a business customer (“Authorized Users”), (b) individuals whose contact details are provided to us in connection with sales, support, or partnership inquiries (“Contacts”), and (c) visitors to our corporate website. It does not create third-party rights and should be read together with our Terms of Service.",
        },
      ],
    },
    {
      id: "roles",
      heading: "2. Our Roles: Data Controller and Data Processor",
      blocks: [
        {
          p: "Certrace’s processing activities fall into two distinct legal capacities under the Thai PDPA:",
        },
        {
          p: "**2.1 Capacity as Data Controller.** With respect to Account Data and Authorized User Data (as defined in Section 3.1) — for example, the name, email address, and job title of individuals who register to use the Platform — Certrace acts as the Data Controller and determines the purposes and means of processing.",
        },
        {
          p: "**2.2 Capacity as Data Processor.** With respect to personal data that may be embedded within Customer Data (as defined in our Terms of Service) — for example, the name or contact details of a supplier’s representative that a business customer (“Customer”) uploads to the Platform as part of its supply chain records — Certrace acts strictly as a Data Processor, processing such data solely on the documented instructions of the relevant Customer, who remains the Data Controller for that data. Requests to exercise data-subject rights over such data should be directed to the relevant Customer in the first instance; Certrace will support the Customer in responding to such requests in accordance with our Terms of Service.",
        },
      ],
    },
    {
      id: "categories",
      heading: "3. Categories of Personal Data We Collect",
      blocks: [
        {
          p: "**3.1 Account and Authorized User Data.** Name, work email address, job title, employer, phone number, password (encrypted), and role/permission level, collected when an Authorized User is registered on the Platform.",
        },
        {
          p: "**3.2 Customer Business Data.** Data that Customer uploads to the Platform for ESG and CBAM reporting purposes — including production volumes, energy sources, facility information, and supplier or supply-chain information — which may incidentally include the names or contact details of Customer’s own personnel or suppliers’ representatives. Certrace processes this category as a Data Processor as described in Section 2.2.",
        },
        {
          p: "**3.3 Billing and Payment Data.** Billing contact name, company registration details, invoicing address, and payment records. Certrace does not directly store full payment card numbers; payments are processed through PCI-compliant third-party payment processors.",
        },
        {
          p: "**3.4 Platform and Website Usage Data.** IP address, browser and device information, log data, and usage analytics collected automatically through the Platform and our corporate website, including through cookies and similar tracking technologies described in Section 12.",
        },
        {
          p: "**3.5 Communications Data.** Information provided when Contacts or Authorized Users communicate with us, such as through support tickets, sales inquiries, emails, or scheduled calls/demos.",
        },
      ],
    },
    {
      id: "use",
      heading: "4. How We Use Personal Data",
      blocks: [
        {
          p: "We process the categories of Personal Data described above for the following purposes:",
        },
        {
          p: "**4.1 Service Delivery.** To create and manage Authorized User accounts, provide access to the Platform, and generate Reports and Outputs for Customer.",
        },
        {
          p: "**4.2 Account and Security Management.** To authenticate users, maintain the security and integrity of the Platform, detect and prevent fraud or unauthorized access, and enforce our Terms of Service.",
        },
        {
          p: "**4.3 Customer Support.** To respond to inquiries, provide technical support, and communicate service-related updates (e.g., maintenance windows, security notices).",
        },
        {
          p: "**4.4 Billing and Administration.** To process payments, issue invoices and receipts, and maintain financial records as required by law.",
        },
        {
          p: "**4.5 Product Improvement.** To analyze aggregated or de-identified usage patterns to improve the Platform’s features, reliability, and calculation methodologies.",
        },
        {
          p: `**4.6 Sales and Marketing Communications.** To respond to demo requests and, where the Contact has provided opt-in consent, to send product updates, newsletters, or promotional communications. Recipients may withdraw consent at any time via the unsubscribe mechanism in each communication or by contacting us at ${CONTACT_EMAIL}.`,
        },
        {
          p: "**4.7 Legal and Regulatory Compliance.** To comply with applicable law, respond to lawful requests from public authorities, and establish, exercise, or defend legal claims.",
        },
      ],
    },
    {
      id: "legal-bases",
      heading: "5. Legal Bases for Processing",
      blocks: [
        {
          p: "Under the Thai PDPA, we rely on the following legal bases, depending on the processing activity:",
        },
        {
          ul: [
            "**Performance of a contract** — to provide the Platform under the Terms of Service agreed with Customer, and to manage Authorized User accounts necessary for that purpose;",
            "**Legitimate interests** — for security, fraud prevention, product improvement, and responding to business inquiries, balanced against the interests and rights of the data subject;",
            "**Consent** — for marketing communications and for any non-essential cookies, as described in Section 12;",
            "**Legal obligation** — for tax, accounting, and regulatory record-keeping; and",
            "**Vital interests or substantial public interest** — only in the rare circumstances where applicable.",
          ],
        },
      ],
    },
    {
      id: "automated",
      heading: "6. Automated Processing and Calculation Tools",
      blocks: [
        {
          p: "**6.1** The Platform uses proprietary calculation methodologies and, in some features, third-party or in-house machine-learning tools to process Customer Data (including any embedded personal data) to generate emissions estimates, ESG scores, and CBAM-related Reports.",
        },
        {
          p: "**6.2** We do not use personal data collected through the Platform to train foundational or third-party machine-learning models made available to parties other than the relevant Customer.",
        },
        {
          p: "**6.3** Reports and Outputs are provided on an “as-is” basis, and the relevant Customer bears sole responsibility for reviewing, verifying, and, where required, independently validating the factual accuracy of such Reports before relying on them for any regulatory, commercial, or professional purpose, as further described in our Terms of Service.",
        },
      ],
    },
    {
      id: "sharing",
      heading: "7. Data Sharing and Disclosure",
      blocks: [
        {
          p: "We do not sell personal data. We may share personal data in the following circumstances:",
        },
        {
          p: "**7.1 Sub-processors.** With cloud hosting, infrastructure, analytics, customer support, and email-delivery providers that process personal data on our behalf under written data-processing terms consistent with the Thai PDPA.",
        },
        {
          p: "**7.2 Within the Customer Organization.** Account and Authorized User Data may be visible to other Authorized Users and administrators within the same Customer account, as configured by Customer’s account settings.",
        },
        {
          p: "**7.3 Professional Advisors.** With our auditors, accountants, and legal advisors, as reasonably necessary to obtain professional advice.",
        },
        {
          p: "**7.4 Regulatory and Legal Disclosures.** With courts, regulators, or law enforcement authorities where required by a valid legal mandate, subpoena, or statutory obligation.",
        },
        {
          p: "**7.5 Business Transfers.** In connection with a merger, acquisition, financing, or sale of assets, subject to the acquiring party’s commitment to handle personal data consistent with this Privacy Policy.",
        },
      ],
    },
    {
      id: "transfers",
      heading: "8. Cross-Border Data Transfers",
      blocks: [
        {
          p: "Certrace’s infrastructure providers may host data outside Thailand. Where we transfer personal data outside Thailand, we take steps required under the Thai PDPA to ensure the receiving jurisdiction or recipient provides an adequate level of data protection, or we implement appropriate safeguards (such as contractual data-protection commitments with our Sub-processors) before making the transfer, unless a statutory exemption applies.",
        },
      ],
    },
    {
      id: "security",
      heading: "9. Data Security",
      blocks: [
        {
          p: "We implement technical and organizational security measures designed to protect personal data against unauthorized access, alteration, disclosure, or destruction, including encryption in transit, access controls, and regular security reviews of our infrastructure providers. No system can be guaranteed to be 100% secure, and we encourage Authorized Users to use strong, unique passwords and to safeguard their credentials.",
        },
      ],
    },
    {
      id: "retention",
      heading: "10. Data Retention",
      blocks: [
        {
          p: "We retain Account and Authorized User Data for as long as the associated Customer account remains active, and for a reasonable period thereafter to comply with legal, accounting, or dispute-resolution obligations, after which it is deleted or anonymized. Customer Business Data processed as a Data Processor is retained and deleted in accordance with the Customer’s instructions and our Terms of Service (see Section 6.5 of the Terms of Service regarding export and deletion following termination).",
        },
      ],
    },
    {
      id: "rights",
      heading: "11. Your Rights as a Data Subject",
      blocks: [
        {
          p: "Subject to the exceptions and conditions set out in the Thai PDPA, data subjects have the right to:",
        },
        {
          ul: [
            "**Access** their personal data and obtain a copy of it;",
            "**Rectify** inaccurate or incomplete personal data;",
            "**Erase or destroy** personal data, or restrict its processing, in certain circumstances;",
            "**Object** to processing carried out on the basis of legitimate interests or for direct marketing;",
            "**Data portability**, where technically feasible;",
            "**Withdraw consent** at any time, where processing is based on consent, without affecting the lawfulness of processing before withdrawal; and",
            "**Lodge a complaint** with Thailand’s Office of the Personal Data Protection Committee (PDPC) if they believe their rights have been infringed.",
          ],
        },
        {
          p: `To exercise these rights over Account or Authorized User Data (where Certrace acts as Data Controller), contact us at ${CONTACT_EMAIL}. Where a request concerns data for which Certrace acts as a Data Processor on behalf of a Customer, we will direct the request to, or act on the instruction of, the relevant Customer, consistent with Section 2.2.`,
        },
      ],
    },
    {
      id: "cookies",
      heading: "12. Cookies and Similar Technologies",
      blocks: [
        {
          p: "We use cookies and similar technologies on our Platform and corporate website to (a) maintain login sessions and essential functionality, (b) understand usage patterns to improve the Platform, and (c) where consented, measure marketing campaign performance. Essential cookies are necessary for the Platform to function and cannot be disabled. Non-essential cookies are used only with opt-in consent, which may be withdrawn at any time through the cookie settings on our website or applicable browser controls.",
        },
      ],
    },
    {
      id: "minors",
      heading: "13. Business Use; Minors",
      blocks: [
        {
          p: "The Platform is intended solely for business use by adult professionals acting on behalf of a Customer, and is not directed to, or intended for use by, individuals under eighteen (18) years of age. We do not knowingly collect personal data from minors. If we become aware that we have inadvertently collected such data, we will take reasonable steps to delete it.",
        },
      ],
    },
    {
      id: "links",
      heading: "14. Third-Party Links",
      blocks: [
        {
          p: "The Platform or our website may contain links to third-party websites or services. We are not responsible for the privacy practices of such third parties, and we encourage users to review their respective privacy policies.",
        },
      ],
    },
    {
      id: "changes",
      heading: "15. Changes to this Privacy Policy",
      blocks: [
        {
          p: "We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will indicate the “Last Updated” date at the top of this Privacy Policy and, for material changes, provide notice through the Platform or by email prior to the changes taking effect. Continued use of the Platform following such notice constitutes acknowledgment of the revised Privacy Policy.",
        },
      ],
    },
    {
      id: "contact",
      heading: "16. Contact Us",
      blocks: [
        {
          p: `For any questions, requests, or complaints regarding this Privacy Policy or our data processing practices, please contact our Data Protection Officer at: **${CONTACT_EMAIL}**.`,
        },
      ],
    },
  ],
};

export const PRIVACY_TH: LegalDoc = {
  eyebrow: "ข้อกำหนดและกฎหมาย",
  title: "นโยบายความเป็นส่วนตัวของ Certrace",
  effectiveLabel: "วันที่มีผลบังคับใช้",
  effective: "30 กรกฎาคม 2026",
  updatedLabel: "อัปเดตล่าสุด",
  updated: "30 กรกฎาคม 2026",
  lede: "Certrace เก็บรวบรวม ใช้ เปิดเผย และคุ้มครองข้อมูลส่วนบุคคลอย่างไร ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ของประเทศไทย",
  contentsLabel: "หัวข้อในหน้านี้",
  languageNote:
    "ฉบับแปลภาษาไทยนี้จัดทำขึ้นเพื่อความสะดวกในการอ่าน หากมีข้อความใดขัดหรือแย้งกัน ให้ยึดฉบับภาษาอังกฤษเป็นหลัก",
  sections: [
    {
      id: "applicability",
      heading: "1. บทนำและขอบเขตการใช้บังคับ",
      blocks: [
        {
          p: "นโยบายความเป็นส่วนตัวฉบับนี้อธิบายว่า Certrace ซึ่งเป็นบริษัทที่ดำเนินกิจการในกรุงเทพมหานคร ประเทศไทย (“บริษัท” “Certrace” “เรา” หรือ “ของเรา”) เก็บรวบรวม ใช้ เปิดเผย และคุ้มครองข้อมูลส่วนบุคคลอย่างไร ในส่วนที่เกี่ยวข้องกับแพลตฟอร์ม Certrace สำหรับการจัดการข้อมูล ESG และการสนับสนุนการปฏิบัติตาม CBAM (“แพลตฟอร์ม” หรือ “บริการ”) ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ของประเทศไทย (“PDPA”) และกฎหมายคุ้มครองข้อมูลอื่นที่ใช้บังคับ",
        },
        {
          p: "นโยบายฉบับนี้ใช้กับข้อมูลส่วนบุคคลของ (ก) บุคคลที่ลงทะเบียนหรือใช้งานแพลตฟอร์มในนามของลูกค้าองค์กร (“ผู้ใช้ที่ได้รับอนุญาต”) (ข) บุคคลที่มีการให้ข้อมูลติดต่อแก่เราในส่วนที่เกี่ยวกับการขาย การสนับสนุน หรือการสอบถามด้านความร่วมมือ (“ผู้ติดต่อ”) และ (ค) ผู้เข้าชมเว็บไซต์ของบริษัท นโยบายนี้ไม่ก่อให้เกิดสิทธิแก่บุคคลภายนอก และควรอ่านประกอบกับข้อกำหนดการใช้งานของเรา",
        },
      ],
    },
    {
      id: "roles",
      heading: "2. บทบาทของเรา: ผู้ควบคุมข้อมูลและผู้ประมวลผลข้อมูล",
      blocks: [
        {
          p: "กิจกรรมการประมวลผลของ Certrace แบ่งออกเป็นสองสถานะทางกฎหมายที่แตกต่างกันภายใต้ PDPA:",
        },
        {
          p: "**2.1 สถานะผู้ควบคุมข้อมูลส่วนบุคคล** สำหรับข้อมูลบัญชีและข้อมูลผู้ใช้ที่ได้รับอนุญาต (ตามนิยามในข้อ 3.1) เช่น ชื่อ อีเมล และตำแหน่งงานของบุคคลที่ลงทะเบียนใช้งานแพลตฟอร์ม Certrace ทำหน้าที่เป็นผู้ควบคุมข้อมูลส่วนบุคคล และเป็นผู้กำหนดวัตถุประสงค์และวิธีการประมวลผล",
        },
        {
          p: "**2.2 สถานะผู้ประมวลผลข้อมูลส่วนบุคคล** สำหรับข้อมูลส่วนบุคคลที่อาจฝังอยู่ในข้อมูลลูกค้า (ตามนิยามในข้อกำหนดการใช้งาน) เช่น ชื่อหรือข้อมูลติดต่อของผู้แทนซัพพลายเออร์ที่ลูกค้าองค์กร (“ลูกค้า”) อัปโหลดเข้าสู่แพลตฟอร์มเป็นส่วนหนึ่งของบันทึกห่วงโซ่อุปทาน Certrace ทำหน้าที่เป็นผู้ประมวลผลข้อมูลส่วนบุคคลอย่างเคร่งครัด โดยประมวลผลตามคำสั่งที่เป็นลายลักษณ์อักษรของลูกค้ารายนั้นเท่านั้น ซึ่งลูกค้ายังคงเป็นผู้ควบคุมข้อมูลส่วนบุคคลสำหรับข้อมูลดังกล่าว คำขอใช้สิทธิของเจ้าของข้อมูลส่วนบุคคลเกี่ยวกับข้อมูลนี้ควรส่งไปยังลูกค้ารายนั้นเป็นลำดับแรก โดย Certrace จะสนับสนุนลูกค้าในการตอบคำขอตามข้อกำหนดการใช้งานของเรา",
        },
      ],
    },
    {
      id: "categories",
      heading: "3. ประเภทของข้อมูลส่วนบุคคลที่เราเก็บรวบรวม",
      blocks: [
        {
          p: "**3.1 ข้อมูลบัญชีและข้อมูลผู้ใช้ที่ได้รับอนุญาต** ชื่อ อีเมลที่ทำงาน ตำแหน่งงาน นายจ้าง หมายเลขโทรศัพท์ รหัสผ่าน (เข้ารหัสไว้) และระดับบทบาท/สิทธิ์ ซึ่งเก็บรวบรวมเมื่อมีการลงทะเบียนผู้ใช้ที่ได้รับอนุญาตบนแพลตฟอร์ม",
        },
        {
          p: "**3.2 ข้อมูลธุรกิจของลูกค้า** ข้อมูลที่ลูกค้าอัปโหลดเข้าสู่แพลตฟอร์มเพื่อการรายงาน ESG และ CBAM รวมถึงปริมาณการผลิต แหล่งพลังงาน ข้อมูลโรงงาน และข้อมูลซัพพลายเออร์หรือห่วงโซ่อุปทาน ซึ่งอาจมีชื่อหรือข้อมูลติดต่อของบุคลากรของลูกค้าหรือผู้แทนซัพพลายเออร์ปะปนอยู่ Certrace ประมวลผลข้อมูลประเภทนี้ในฐานะผู้ประมวลผลข้อมูลส่วนบุคคลตามที่อธิบายในข้อ 2.2",
        },
        {
          p: "**3.3 ข้อมูลการวางบิลและการชำระเงิน** ชื่อผู้ติดต่อด้านการวางบิล รายละเอียดการจดทะเบียนบริษัท ที่อยู่สำหรับออกใบแจ้งหนี้ และบันทึกการชำระเงิน Certrace ไม่จัดเก็บหมายเลขบัตรชำระเงินฉบับเต็มโดยตรง การชำระเงินดำเนินการผ่านผู้ให้บริการรับชำระเงินภายนอกที่ได้มาตรฐาน PCI",
        },
        {
          p: "**3.4 ข้อมูลการใช้งานแพลตฟอร์มและเว็บไซต์** หมายเลข IP ข้อมูลเบราว์เซอร์และอุปกรณ์ ข้อมูลบันทึกการใช้งาน และข้อมูลวิเคราะห์การใช้งานที่เก็บโดยอัตโนมัติผ่านแพลตฟอร์มและเว็บไซต์ของบริษัท รวมถึงผ่านคุกกี้และเทคโนโลยีติดตามในลักษณะเดียวกันตามที่อธิบายในข้อ 12",
        },
        {
          p: "**3.5 ข้อมูลการติดต่อสื่อสาร** ข้อมูลที่ให้ไว้เมื่อผู้ติดต่อหรือผู้ใช้ที่ได้รับอนุญาตติดต่อกับเรา เช่น ผ่านคำร้องขอความช่วยเหลือ การสอบถามด้านการขาย อีเมล หรือการนัดหมายพูดคุยและสาธิตระบบ",
        },
      ],
    },
    {
      id: "use",
      heading: "4. เราใช้ข้อมูลส่วนบุคคลอย่างไร",
      blocks: [
        {
          p: "เราประมวลผลข้อมูลส่วนบุคคลประเภทต่าง ๆ ข้างต้นเพื่อวัตถุประสงค์ดังนี้:",
        },
        {
          p: "**4.1 การให้บริการ** เพื่อสร้างและจัดการบัญชีผู้ใช้ที่ได้รับอนุญาต ให้สิทธิ์เข้าถึงแพลตฟอร์ม และสร้างรายงานและผลลัพธ์ให้ลูกค้า",
        },
        {
          p: "**4.2 การจัดการบัญชีและความปลอดภัย** เพื่อยืนยันตัวตนผู้ใช้ รักษาความปลอดภัยและความสมบูรณ์ของแพลตฟอร์ม ตรวจจับและป้องกันการฉ้อฉลหรือการเข้าถึงโดยไม่ได้รับอนุญาต และบังคับใช้ข้อกำหนดการใช้งานของเรา",
        },
        {
          p: "**4.3 การสนับสนุนลูกค้า** เพื่อตอบคำถาม ให้การสนับสนุนทางเทคนิค และแจ้งข้อมูลที่เกี่ยวกับบริการ (เช่น ช่วงบำรุงรักษา ประกาศด้านความปลอดภัย)",
        },
        {
          p: "**4.4 การวางบิลและงานธุรการ** เพื่อดำเนินการชำระเงิน ออกใบแจ้งหนี้และใบเสร็จ และเก็บรักษาบันทึกทางการเงินตามที่กฎหมายกำหนด",
        },
        {
          p: "**4.5 การพัฒนาผลิตภัณฑ์** เพื่อวิเคราะห์รูปแบบการใช้งานแบบรวมหรือแบบไม่ระบุตัวตน เพื่อปรับปรุงฟีเจอร์ ความเสถียร และวิธีการคำนวณของแพลตฟอร์ม",
        },
        {
          p: `**4.6 การสื่อสารด้านการขายและการตลาด** เพื่อตอบคำขอชมการสาธิต และในกรณีที่ผู้ติดต่อให้ความยินยอมไว้ เพื่อส่งข้อมูลอัปเดตผลิตภัณฑ์ จดหมายข่าว หรือข้อความส่งเสริมการขาย ผู้รับสามารถถอนความยินยอมได้ตลอดเวลาผ่านลิงก์ยกเลิกการรับข่าวสารในแต่ละฉบับ หรือติดต่อเราที่ ${CONTACT_EMAIL}`,
        },
        {
          p: "**4.7 การปฏิบัติตามกฎหมายและกฎระเบียบ** เพื่อปฏิบัติตามกฎหมายที่ใช้บังคับ ตอบสนองคำขอที่ชอบด้วยกฎหมายจากหน่วยงานรัฐ และก่อตั้ง ใช้ หรือต่อสู้สิทธิเรียกร้องทางกฎหมาย",
        },
      ],
    },
    {
      id: "legal-bases",
      heading: "5. ฐานทางกฎหมายในการประมวลผล",
      blocks: [
        {
          p: "ภายใต้ PDPA เราอาศัยฐานทางกฎหมายต่อไปนี้ ขึ้นอยู่กับกิจกรรมการประมวลผล:",
        },
        {
          ul: [
            "**การปฏิบัติตามสัญญา** — เพื่อให้บริการแพลตฟอร์มตามข้อกำหนดการใช้งานที่ตกลงกับลูกค้า และเพื่อจัดการบัญชีผู้ใช้ที่ได้รับอนุญาตที่จำเป็นต่อการนั้น",
            "**ประโยชน์โดยชอบด้วยกฎหมาย** — เพื่อความปลอดภัย การป้องกันการฉ้อฉล การพัฒนาผลิตภัณฑ์ และการตอบข้อสอบถามทางธุรกิจ โดยชั่งน้ำหนักกับสิทธิและประโยชน์ของเจ้าของข้อมูลส่วนบุคคล",
            "**ความยินยอม** — สำหรับการสื่อสารด้านการตลาดและคุกกี้ที่ไม่จำเป็นต่อการทำงาน ตามที่อธิบายในข้อ 12",
            "**หน้าที่ตามกฎหมาย** — สำหรับการเก็บรักษาบันทึกด้านภาษี บัญชี และกฎระเบียบ และ",
            "**ประโยชน์สำคัญต่อชีวิตหรือประโยชน์สาธารณะที่สำคัญ** — เฉพาะในกรณีที่จำเป็นซึ่งเกิดขึ้นได้ยาก",
          ],
        },
      ],
    },
    {
      id: "automated",
      heading: "6. การประมวลผลอัตโนมัติและเครื่องมือคำนวณ",
      blocks: [
        {
          p: "**6.1** แพลตฟอร์มใช้วิธีการคำนวณอันเป็นกรรมสิทธิ์ของเรา และในบางฟีเจอร์ใช้เครื่องมือแมชชีนเลิร์นนิงของบุคคลภายนอกหรือที่พัฒนาขึ้นเอง เพื่อประมวลผลข้อมูลลูกค้า (รวมถึงข้อมูลส่วนบุคคลที่ฝังอยู่) ในการสร้างการประมาณการการปล่อยคาร์บอน คะแนน ESG และรายงานที่เกี่ยวกับ CBAM",
        },
        {
          p: "**6.2** เราไม่ใช้ข้อมูลส่วนบุคคลที่เก็บผ่านแพลตฟอร์มเพื่อฝึกโมเดลแมชชีนเลิร์นนิงพื้นฐานหรือของบุคคลภายนอกที่เปิดให้ผู้อื่นนอกเหนือจากลูกค้ารายนั้นใช้งาน",
        },
        {
          p: "**6.3** รายงานและผลลัพธ์ให้บริการ “ตามสภาพที่เป็นอยู่” และลูกค้ารายนั้นรับผิดชอบแต่เพียงผู้เดียวในการตรวจทาน ตรวจสอบ และเมื่อจำเป็น ยืนยันความถูกต้องของข้อเท็จจริงในรายงานโดยอิสระ ก่อนนำไปใช้เพื่อวัตถุประสงค์ด้านกฎระเบียบ การค้า หรือวิชาชีพใด ๆ ตามที่อธิบายเพิ่มเติมในข้อกำหนดการใช้งานของเรา",
        },
      ],
    },
    {
      id: "sharing",
      heading: "7. การแบ่งปันและเปิดเผยข้อมูล",
      blocks: [
        {
          p: "เราไม่ขายข้อมูลส่วนบุคคล เราอาจแบ่งปันข้อมูลส่วนบุคคลในกรณีต่อไปนี้:",
        },
        {
          p: "**7.1 ผู้ประมวลผลช่วง** กับผู้ให้บริการโฮสติ้งบนคลาวด์ โครงสร้างพื้นฐาน การวิเคราะห์ข้อมูล การสนับสนุนลูกค้า และการส่งอีเมล ซึ่งประมวลผลข้อมูลส่วนบุคคลในนามของเราภายใต้ข้อตกลงการประมวลผลข้อมูลเป็นลายลักษณ์อักษรที่สอดคล้องกับ PDPA",
        },
        {
          p: "**7.2 ภายในองค์กรของลูกค้า** ข้อมูลบัญชีและข้อมูลผู้ใช้ที่ได้รับอนุญาตอาจปรากฏต่อผู้ใช้ที่ได้รับอนุญาตและผู้ดูแลรายอื่นภายในบัญชีลูกค้าเดียวกัน ตามการตั้งค่าบัญชีของลูกค้า",
        },
        {
          p: "**7.3 ที่ปรึกษาวิชาชีพ** กับผู้ตรวจสอบบัญชี นักบัญชี และที่ปรึกษากฎหมายของเรา เท่าที่จำเป็นตามสมควรเพื่อขอคำแนะนำเชิงวิชาชีพ",
        },
        {
          p: "**7.4 การเปิดเผยตามกฎหมายและกฎระเบียบ** กับศาล หน่วยงานกำกับดูแล หรือหน่วยงานบังคับใช้กฎหมาย เมื่อมีคำสั่งทางกฎหมายที่ชอบด้วยกฎหมาย หมายเรียก หรือหน้าที่ตามกฎหมาย",
        },
        {
          p: "**7.5 การโอนกิจการ** ในส่วนที่เกี่ยวกับการควบรวมกิจการ การซื้อกิจการ การระดมทุน หรือการขายทรัพย์สิน โดยผู้รับโอนต้องผูกพันที่จะจัดการข้อมูลส่วนบุคคลให้สอดคล้องกับนโยบายฉบับนี้",
        },
      ],
    },
    {
      id: "transfers",
      heading: "8. การโอนข้อมูลข้ามพรมแดน",
      blocks: [
        {
          p: "ผู้ให้บริการโครงสร้างพื้นฐานของ Certrace อาจจัดเก็บข้อมูลไว้นอกประเทศไทย ในกรณีที่เราโอนข้อมูลส่วนบุคคลออกนอกประเทศไทย เราจะดำเนินการตามที่ PDPA กำหนดเพื่อให้มั่นใจว่าประเทศปลายทางหรือผู้รับข้อมูลมีมาตรฐานการคุ้มครองข้อมูลที่เพียงพอ หรือจัดให้มีมาตรการคุ้มครองที่เหมาะสม (เช่น ข้อผูกพันด้านการคุ้มครองข้อมูลตามสัญญากับผู้ประมวลผลช่วงของเรา) ก่อนการโอน เว้นแต่เข้าข้อยกเว้นตามกฎหมาย",
        },
      ],
    },
    {
      id: "security",
      heading: "9. ความปลอดภัยของข้อมูล",
      blocks: [
        {
          p: "เราจัดให้มีมาตรการรักษาความปลอดภัยทางเทคนิคและเชิงองค์กรเพื่อคุ้มครองข้อมูลส่วนบุคคลจากการเข้าถึง แก้ไข เปิดเผย หรือทำลายโดยไม่ได้รับอนุญาต รวมถึงการเข้ารหัสระหว่างการส่งข้อมูล การควบคุมสิทธิ์การเข้าถึง และการทบทวนความปลอดภัยของผู้ให้บริการโครงสร้างพื้นฐานอย่างสม่ำเสมอ ไม่มีระบบใดรับประกันความปลอดภัยได้ 100% เราจึงแนะนำให้ผู้ใช้ที่ได้รับอนุญาตใช้รหัสผ่านที่คาดเดายากและไม่ซ้ำกัน และรักษาข้อมูลเข้าสู่ระบบของตนให้ปลอดภัย",
        },
      ],
    },
    {
      id: "retention",
      heading: "10. ระยะเวลาการเก็บรักษาข้อมูล",
      blocks: [
        {
          p: "เราเก็บรักษาข้อมูลบัญชีและข้อมูลผู้ใช้ที่ได้รับอนุญาตตลอดระยะเวลาที่บัญชีลูกค้าที่เกี่ยวข้องยังใช้งานอยู่ และต่อไปอีกช่วงระยะเวลาตามสมควรเพื่อปฏิบัติตามหน้าที่ทางกฎหมาย บัญชี หรือการระงับข้อพิพาท หลังจากนั้นจะลบหรือทำให้ไม่ระบุตัวตน ส่วนข้อมูลธุรกิจของลูกค้าที่เราประมวลผลในฐานะผู้ประมวลผลข้อมูลส่วนบุคคล จะเก็บรักษาและลบตามคำสั่งของลูกค้าและข้อกำหนดการใช้งานของเรา (ดูข้อ 6.5 ของข้อกำหนดการใช้งานเกี่ยวกับการส่งออกและการลบข้อมูลหลังการยุติ)",
        },
      ],
    },
    {
      id: "rights",
      heading: "11. สิทธิของคุณในฐานะเจ้าของข้อมูลส่วนบุคคล",
      blocks: [
        {
          p: "ภายใต้ข้อยกเว้นและเงื่อนไขที่กำหนดไว้ใน PDPA เจ้าของข้อมูลส่วนบุคคลมีสิทธิดังนี้:",
        },
        {
          ul: [
            "**สิทธิเข้าถึง** ข้อมูลส่วนบุคคลของตนและขอรับสำเนา",
            "**สิทธิขอแก้ไข** ข้อมูลส่วนบุคคลที่ไม่ถูกต้องหรือไม่ครบถ้วน",
            "**สิทธิขอลบหรือทำลาย** ข้อมูลส่วนบุคคล หรือขอให้ระงับการใช้ข้อมูล ในบางกรณี",
            "**สิทธิคัดค้าน** การประมวลผลที่อาศัยฐานประโยชน์โดยชอบด้วยกฎหมาย หรือเพื่อการตลาดแบบตรง",
            "**สิทธิให้โอนย้ายข้อมูล** เท่าที่ทำได้ในทางเทคนิค",
            "**สิทธิถอนความยินยอม** ได้ตลอดเวลาในกรณีที่การประมวลผลอาศัยฐานความยินยอม โดยไม่กระทบต่อความชอบด้วยกฎหมายของการประมวลผลก่อนการถอน และ",
            "**สิทธิร้องเรียน** ต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.) ของประเทศไทย หากเห็นว่าสิทธิของตนถูกละเมิด",
          ],
        },
        {
          p: `หากต้องการใช้สิทธิเหล่านี้กับข้อมูลบัญชีหรือข้อมูลผู้ใช้ที่ได้รับอนุญาต (ซึ่ง Certrace เป็นผู้ควบคุมข้อมูลส่วนบุคคล) กรุณาติดต่อเราที่ ${CONTACT_EMAIL} ในกรณีที่คำขอเกี่ยวกับข้อมูลที่ Certrace ทำหน้าที่เป็นผู้ประมวลผลข้อมูลส่วนบุคคลในนามของลูกค้า เราจะส่งต่อคำขอไปยังลูกค้ารายนั้นหรือดำเนินการตามคำสั่งของลูกค้า ตามที่ระบุในข้อ 2.2`,
        },
      ],
    },
    {
      id: "cookies",
      heading: "12. คุกกี้และเทคโนโลยีที่คล้ายกัน",
      blocks: [
        {
          p: "เราใช้คุกกี้และเทคโนโลยีที่คล้ายกันบนแพลตฟอร์มและเว็บไซต์ของบริษัท เพื่อ (ก) รักษาสถานะการเข้าสู่ระบบและการทำงานที่จำเป็น (ข) ทำความเข้าใจรูปแบบการใช้งานเพื่อปรับปรุงแพลตฟอร์ม และ (ค) วัดผลแคมเปญการตลาดในกรณีที่ได้รับความยินยอม คุกกี้ที่จำเป็นเป็นสิ่งที่ขาดไม่ได้ต่อการทำงานของแพลตฟอร์มและไม่สามารถปิดได้ ส่วนคุกกี้ที่ไม่จำเป็นจะใช้เมื่อได้รับความยินยอมเท่านั้น ซึ่งถอนได้ตลอดเวลาผ่านการตั้งค่าคุกกี้บนเว็บไซต์ของเราหรือการตั้งค่าเบราว์เซอร์",
        },
      ],
    },
    {
      id: "minors",
      heading: "13. การใช้งานเชิงธุรกิจและผู้เยาว์",
      blocks: [
        {
          p: "แพลตฟอร์มมีไว้สำหรับการใช้งานเชิงธุรกิจโดยบุคลากรที่บรรลุนิติภาวะซึ่งกระทำการในนามของลูกค้าเท่านั้น ไม่ได้มุ่งหมายให้บุคคลที่มีอายุต่ำกว่าสิบแปด (18) ปีใช้งาน เราไม่เก็บรวบรวมข้อมูลส่วนบุคคลจากผู้เยาว์โดยเจตนา หากเราทราบว่าได้เก็บข้อมูลดังกล่าวไว้โดยไม่ตั้งใจ เราจะดำเนินการตามสมควรเพื่อลบข้อมูลนั้น",
        },
      ],
    },
    {
      id: "links",
      heading: "14. ลิงก์ไปยังบุคคลภายนอก",
      blocks: [
        {
          p: "แพลตฟอร์มหรือเว็บไซต์ของเราอาจมีลิงก์ไปยังเว็บไซต์หรือบริการของบุคคลภายนอก เราไม่รับผิดชอบต่อแนวปฏิบัติด้านความเป็นส่วนตัวของบุคคลภายนอกเหล่านั้น และขอแนะนำให้ผู้ใช้ตรวจสอบนโยบายความเป็นส่วนตัวของแต่ละรายด้วย",
        },
      ],
    },
    {
      id: "changes",
      heading: "15. การเปลี่ยนแปลงนโยบายฉบับนี้",
      blocks: [
        {
          p: "เราอาจปรับปรุงนโยบายความเป็นส่วนตัวฉบับนี้เป็นครั้งคราวเพื่อสะท้อนการเปลี่ยนแปลงในแนวปฏิบัติของเราหรือกฎหมายที่ใช้บังคับ เราจะระบุวันที่ “อัปเดตล่าสุด” ไว้ด้านบนของนโยบายฉบับนี้ และสำหรับการเปลี่ยนแปลงในสาระสำคัญ จะแจ้งผ่านแพลตฟอร์มหรือทางอีเมลก่อนที่การเปลี่ยนแปลงจะมีผล การใช้งานแพลตฟอร์มต่อไปหลังได้รับแจ้ง ถือเป็นการรับทราบนโยบายฉบับปรับปรุง",
        },
      ],
    },
    {
      id: "contact",
      heading: "16. ติดต่อเรา",
      blocks: [
        {
          p: `หากมีคำถาม คำขอ หรือข้อร้องเรียนเกี่ยวกับนโยบายความเป็นส่วนตัวฉบับนี้หรือแนวปฏิบัติด้านการประมวลผลข้อมูลของเรา กรุณาติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลของเราที่ **${CONTACT_EMAIL}**`,
        },
      ],
    },
  ],
};
