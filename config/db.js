const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// ---- Define Schemas -----
const proctoredExamSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    provider: String,
    type: String,
    website: String
});

const onlineExamSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    exam_type: String,
    online: Boolean,
    website: String
});

const atiModuleSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    category: String
});

const onlineClassSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    type: String,
    provider: String,
    website: String
});

// ---- Define Models ----
const ProctoredExam = mongoose.model('ProctoredExam', proctoredExamSchema);
const OnlineExam = mongoose.model('OnlineExam', onlineExamSchema);
const AtiModule = mongoose.model('AtiModule', atiModuleSchema);
const OnlineClass = mongoose.model('OnlineClass', onlineClassSchema);

async function connect() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/avrilwritersDB');
        console.log("Seeding database...");

        // --------- 1. Proctored Exams ----------
        await ProctoredExam.insertMany([
            {
                "name": "Examplify",
                "provider": "",
                "type": "Remote Proctoring",
                "website": "https://examity.com"
            },
            {
                "name": "ProctorU / Meazure Learning / Guardian Browser",
                "provider": "Meazure Learning",
                "type": "Remote Proctoring",
                "website": "https://www.proctoru.com"
            },
            {
                "name": "Proctortrack",
                "provider": "",
                "type": "Remote Proctoring",
                "website": ""
            },
            {
                "name": "Honorlock",
                "provider": "",
                "type": "Remote Proctoring",
                "website": "https://honorlock.com"
            },
            {
                "name": "PSI Online Proctoring",
                "provider": "PSI",
                "type": "Remote Proctoring",
                "website": "https://www.psionline.com"
            },
            {
                "name": "Auto Proctor",
                "": ""            },
            {
                "name": "Proctorio",
                "provider": "",
                "type": "Remote Proctoring",
                "website": "https://proctorio.com"
            },
            {
                "name": "ProctorFree",
                "provider": "",
                "type": "Remote Proctoring",
                "website": ""
            },
            {
                "name": "Respondus Lockdown",
                "provider": "Respondus",
                "type": "Remote Proctoring",
                "website": "https://web.respondus.com/he/monitor"
            },
            {
                "name": "MonitorEDU",
                "provider": "",
                "type": "Remote Proctoring",
                "website": ""
            },
            {
                "name": "Proctor360",
                "provider": "",
                "type": "Remote Proctoring",
                "website": ""
            },
            {
                "name": "SmarterProctoring",
                "provider": "",
                "type": "Remote Proctoring",
                "website": ""
            },
            {
                "name": "OnVUE",
                "provider": "Pearson VUE",
                "type": "Remote Proctoring",
                "website": "https://home.pearsonvue.com/onvue"
            },
            {
                "name": "Questionmark",
                "provider": "",
                "type": "Remote Proctoring",
                "website": "https://www.questionmark.com"
            },
            {
                "name": "Invigulus",
                "provider": "",
                "type": "Remote Proctoring",
                "website": ""
            },
            {
                "name": "ETS",
                "provider": "Wheebox",
                "type": "Remote Proctoring",
                "website": "https://www.ets.org",
                
            }
        ]
            , { ordered: false }).catch(e => console.log("Proctored exams might already exist."));

        // --------- 2. Online Exams ----------
        await OnlineExam.insertMany([
            { "name": "TEAS", "exam_type": "Academic Entrance", "online": true },
            { "name": "HESI", "exam_type": "Nursing Exam", "online": true },
            { "name": "GED", "exam_type": "High School Equivalency", "online": true },
            { "name": "ServSafe", "exam_type": "Food Safety", "online": true },
            { "name": "Real Estate Licensing Exam", "exam_type": "Professional License", "online": true },
            { "name": "NHA PLSAT", "exam_type": "Nursing/Healthcare", "online": true },
            { "name": "GRE", "exam_type": "Graduate School Entrance", "online": true },
            { "name": "GMAT", "exam_type": "Graduate School Entrance", "online": true },
            { "name": "SAT", "exam_type": "College Entrance", "online": true },
            { "name": "ACT", "exam_type": "College Entrance", "online": true },
            { "name": "CNA State Exam", "exam_type": "Nursing Certification", "online": true },
            { "name": "NCLEX", "exam_type": "Nursing Certification", "online": true },
            { "name": "CompTIA A+", "exam_type": "IT Certification", "online": true },
            { "name": "CompTIA Security+", "exam_type": "IT Certification", "online": true },
            { "name": "CompTIA Pentest+", "exam_type": "IT Certification", "online": true },
            { "name": "Cisco Certification", "exam_type": "IT Networking", "online": true },
            { "name": "Praxis", "exam_type": "Teacher Certification", "online": true },
            { "name": "CLEP", "exam_type": "College Credit", "online": true },
            { "name": "TOEFL", "exam_type": "English Language Proficiency", "online": true },
            { "name": "IELTS", "exam_type": "English Language Proficiency", "online": true },
            { "name": "CPA Exam", "exam_type": "Accounting Certification", "online": true },
            { "name": "NHA CPCT Certification Exam", "exam_type": "Medical Certification", "online": true },
            { "name": "Medical Assistant Exam", "exam_type": "Medical Certification", "online": true },
            { "name": "Patient Care Technician Exam", "exam_type": "Medical Certification", "online": true },
            { "name": "Phlebotomy Exam", "exam_type": "Medical Certification", "online": true },
            { "name": "Certified Nurse Aide Exam", "exam_type": "Medical Certification", "online": true },
            { "name": "AAMA Certification Exam", "exam_type": "Medical Certification", "online": true },
            { "name": "CMA AMAA Exam", "exam_type": "Medical Certification", "online": true },
            { "name": "exCPT Pharmacy Technician Exam", "exam_type": "Pharmacy Certification", "online": true },
            { "name": "CPHT Pharmacy Tech Test", "exam_type": "Pharmacy Certification", "online": true },
            { "name": "PSI Life Accident and Health or Sickness Exam", "exam_type": "Insurance", "online": true },
            { "name": "PSI Personal Lines Insurance Exam", "exam_type": "Insurance", "online": true },
            { "name": "Life, Accident & Health Insurance Exam", "exam_type": "Insurance", "online": true },
            { "name": "Property and Casualty Insurance Exam", "exam_type": "Insurance", "online": true },
            { "name": "Commercial License Exam", "exam_type": "Professional License", "online": true },
            { "name": "B2 Contractors License Exam", "exam_type": "Professional License", "online": true },
            { "name": "Certified Associate in Project Management (CAPM)", "exam_type": "Project Management Certification", "online": true },
            { "name": "Wonderlic", "exam_type": "Employment/Assessment", "online": true }
        ]
            , { ordered: false }).catch(e => console.log("Online exams might already exist."));

        // --------- 3. ATI VATI Modules ----------
        await AtiModule.insertMany([
            { "name": "Fundamentals", "category": "ATI VATI", "related_exam": "NCLEX" },
            { "name": "Pharmacology", "category": "ATI VATI", "related_exam": "NCLEX" },
            { "name": "Medical-Surgical", "category": "ATI VATI", "related_exam": "NCLEX" },
            { "name": "Maternal Newborn", "category": "ATI VATI", "related_exam": "NCLEX" },
            { "name": "Nursing Care of Children (Pediatric)", "category": "ATI VATI", "related_exam": "NCLEX" },
            { "name": "Mental Health", "category": "ATI VATI", "related_exam": "NCLEX" },
            { "name": "Leadership & Management", "category": "ATI VATI", "related_exam": "NCLEX" },
            { "name": "Predictor / NCLEX Readiness (Comprehensive Predictor)", "category": "ATI VATI", "related_exam": "NCLEX" },
            {"name": "NCLEX"}
        ]
            , { ordered: false }).catch(e => console.log("ATI modules might already exist."));

        // --------- 4. Online Classes ----------
        await OnlineClass.insertMany([
            { "name": "Canvas", "type": "LMS", "provider": "Instructure", "integrations": [], "website": "https://www.instructure.com/canvas" },
            { "name": "D2L Brightspace", "type": "LMS", "provider": "D2L", "integrations": [], "website": "https://www.d2l.com/brightspace" },
            { "name": "Blackboard Learn", "type": "LMS", "provider": "Blackboard", "integrations": [], "website": "https://www.blackboard.com" },
            { "name": "Moodle", "type": "LMS", "provider": "Open Source", "integrations": [], "website": "https://moodle.org" },
            { "name": "ALEKS", "type": "LMS", "provider": "McGraw-Hill", "integrations": [], "website": "https://www.aleks.com" },
            { "name": "Edmentum", "type": "LMS", "provider": "Edmentum", "integrations": [], "website": "https://www.edmentum.com" },
            { "name": "Portage Learning", "type": "LMS", "provider": "Portage Learning", "integrations": [], "website": "" },
            { "name": "McGraw-Hill Platforms", "type": "LMS", "provider": "McGraw-Hill", "integrations": [], "website": "" },
            { "name": "TalentLMS", "type": "LMS", "provider": "TalentLMS", "integrations": [], "website": "https://www.talentlms.com" },
            { "name": "Docebo", "type": "LMS", "provider": "Docebo", "integrations": [], "website": "https://www.docebo.com" },
            { "name": "Absorb LMS", "type": "LMS", "provider": "Absorb", "integrations": [], "website": "https://www.absorblms.com" },
            { "name": "Sakai", "type": "LMS", "provider": "Sakai", "integrations": [], "website": "https://www.sakaiproject.org" },
            { "name": "Open LMS", "type": "LMS", "provider": "Open LMS", "integrations": ["Moodle"], "website": "https://www.openlms.net" },
            { "name": "Google Classroom", "type": "LMS", "provider": "Google", "integrations": [], "website": "https://classroom.google.com" },
            { "name": "LearnDash", "type": "LMS", "provider": "WordPress Plugin", "integrations": [], "website": "https://www.learndash.com" },
            { "name": "OLAT", "type": "LMS", "provider": "OLAT", "integrations": [], "website": "" },
            { "name": "Claroline", "type": "LMS", "provider": "Claroline", "integrations": [], "website": "" }
        ]
            , { ordered: false }).catch(e => console.log("Online classes might already exist."));

        console.log("Database seeding completed!");
    } catch (err) {
        console.error("Error connecting or seeding", err);
    }

}

connect().then((data) => {
    console.log("Database connected successfully.");
}).catch(err => console.log(err));

module.exports = {
    ProctoredExam,
    OnlineExam,
    AtiModule,
    OnlineClass,
};
