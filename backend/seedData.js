import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Job from './models/Job.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Company users data
    const companies = [
      {
        name: 'TechCorp Solutions',
        email: 'hr@techcorp.com',
        username: 'techcorp-hr',
        password: await bcrypt.hash('password123', 12),
        accountType: 'company',
        status: 'hiring',
        address: 'Bandra Kurla Complex, Mumbai, Maharashtra, India',
        latitude: 19.0596,
        longitude: 72.8656,
        companyProfile: {
          companyName: 'TechCorp Solutions',
          website: 'https://techcorp.com',
          industry: 'Technology',
          foundedYear: 2015,
          description: 'Leading software development company specializing in AI and machine learning solutions.'
        }
      },
      {
        name: 'InnovateLabs',
        email: 'careers@innovatelabs.com',
        username: 'innovatelabs-careers',
        password: await bcrypt.hash('password123', 12),
        accountType: 'company',
        status: 'hiring',
        address: 'Electronic City, Bangalore, Karnataka, India',
        latitude: 12.8456,
        longitude: 77.6603,
        companyProfile: {
          companyName: 'InnovateLabs',
          website: 'https://innovatelabs.com',
          industry: 'Software Development',
          foundedYear: 2018,
          description: 'Innovative startup focused on mobile app development and cloud solutions.'
        }
      },
      {
        name: 'DataDriven Inc',
        email: 'jobs@datadriven.com',
        username: 'datadriven-jobs',
        password: await bcrypt.hash('password123', 12),
        accountType: 'company',
        status: 'hiring',
        address: 'Cyber City, Gurgaon, Haryana, India',
        latitude: 28.4595,
        longitude: 77.0266,
        companyProfile: {
          companyName: 'DataDriven Inc',
          website: 'https://datadriven.com',
          industry: 'Data Analytics',
          foundedYear: 2020,
          description: 'Data analytics company helping businesses make informed decisions through advanced analytics.'
        }
      }
    ];

    // Create company users
    const createdCompanies = [];
    for (const company of companies) {
      const existingUser = await User.findOne({ email: company.email });
      if (!existingUser) {
        const newCompany = new User(company);
        await newCompany.save();
        createdCompanies.push(newCompany);
        console.log(`Created company: ${company.name}`);
      } else {
        createdCompanies.push(existingUser);
        console.log(`Company already exists: ${company.name}`);
      }
    }

    // Jobs data
    const jobs = [
      // TechCorp Solutions jobs
      {
        user: createdCompanies[0]._id,
        title: 'Senior Full Stack Developer',
        company: 'TechCorp Solutions',
        location: 'Bandra Kurla Complex, Mumbai, Maharashtra, India',
        latitude: 19.0596,
        longitude: 72.8656,
        type: 'Full-time',
        description: 'Join our dynamic team to build scalable web applications using modern technologies.',
        salary: '₹12,00,000 - ₹18,00,000',
        skillsRequired: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
        perks: 'Health insurance, Flexible working hours, Stock options, Free meals',
        whatYouDo: 'Design and develop full-stack web applications, collaborate with cross-functional teams, mentor junior developers, and participate in code reviews.',
        whatYouGoodAt: 'Strong experience in React and Node.js, understanding of database design, knowledge of cloud platforms, excellent problem-solving skills.',
        aboutYou: 'You are a passionate developer who loves to learn new technologies and work in a fast-paced environment. Team player with excellent communication skills.'
      },
      {
        user: createdCompanies[0]._id,
        title: 'AI/ML Engineer',
        company: 'TechCorp Solutions',
        location: 'Bandra Kurla Complex, Mumbai, Maharashtra, India',
        latitude: 19.0596,
        longitude: 72.8656,
        type: 'Full-time',
        description: 'Work on cutting-edge AI projects and machine learning models.',
        salary: '₹15,00,000 - ₹25,00,000',
        skillsRequired: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Docker'],
        perks: 'Research budget, Conference attendance, Flexible hours, Health benefits',
        whatYouDo: 'Develop machine learning models, implement AI algorithms, analyze large datasets, and deploy ML solutions to production.',
        whatYouGoodAt: 'Strong background in machine learning, experience with deep learning frameworks, proficiency in Python, statistical analysis skills.',
        aboutYou: 'You have a passion for AI and machine learning with a strong mathematical background. You enjoy solving complex problems and staying updated with latest research.'
      },
      {
        user: createdCompanies[0]._id,
        title: 'DevOps Engineer',
        company: 'TechCorp Solutions',
        location: 'Bandra Kurla Complex, Mumbai, Maharashtra, India',
        latitude: 19.0596,
        longitude: 72.8656,
        type: 'Full-time',
        description: 'Manage cloud infrastructure and automate deployment processes.',
        salary: '₹10,00,000 - ₹16,00,000',
        skillsRequired: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform'],
        perks: 'Certification reimbursement, Work from home, Health insurance, Performance bonus',
        whatYouDo: 'Design and maintain CI/CD pipelines, manage cloud infrastructure, monitor system performance, and ensure security compliance.',
        whatYouGoodAt: 'Experience with cloud platforms, knowledge of containerization, understanding of infrastructure as code, scripting skills.',
        aboutYou: 'You are detail-oriented and enjoy automating processes. You have experience with cloud technologies and are passionate about system reliability.'
      },
      // InnovateLabs jobs
      {
        user: createdCompanies[1]._id,
        title: 'Mobile App Developer',
        company: 'InnovateLabs',
        location: 'Electronic City, Bangalore, Karnataka, India',
        latitude: 12.8456,
        longitude: 77.6603,
        type: 'Full-time',
        description: 'Develop innovative mobile applications for iOS and Android platforms.',
        salary: '₹8,00,000 - ₹14,00,000',
        skillsRequired: ['React Native', 'Flutter', 'iOS', 'Android', 'Firebase'],
        perks: 'Flexible timing, Learning budget, Team outings, Health coverage',
        whatYouDo: 'Build cross-platform mobile applications, optimize app performance, integrate APIs, and collaborate with UI/UX designers.',
        whatYouGoodAt: 'Proficiency in React Native or Flutter, understanding of mobile app architecture, experience with app store deployment, API integration skills.',
        aboutYou: 'You are creative and detail-oriented with a passion for mobile technology. You enjoy creating user-friendly applications and staying updated with mobile trends.'
      },
      {
        user: createdCompanies[1]._id,
        title: 'UI/UX Designer',
        company: 'InnovateLabs',
        location: 'Electronic City, Bangalore, Karnataka, India',
        latitude: 12.8456,
        longitude: 77.6603,
        type: 'Full-time',
        description: 'Create beautiful and intuitive user interfaces for web and mobile applications.',
        salary: '₹6,00,000 - ₹12,00,000',
        skillsRequired: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research'],
        perks: 'Creative freedom, Design tools budget, Flexible hours, Team events',
        whatYouDo: 'Design user interfaces, create wireframes and prototypes, conduct user research, and collaborate with development teams.',
        whatYouGoodAt: 'Strong design skills, proficiency in design tools, understanding of user experience principles, ability to create interactive prototypes.',
        aboutYou: 'You have an eye for design and understand user psychology. You are passionate about creating exceptional user experiences and love to iterate based on feedback.'
      },
      {
        user: createdCompanies[1]._id,
        title: 'Frontend Developer Intern',
        company: 'InnovateLabs',
        location: 'Electronic City, Bangalore, Karnataka, India',
        latitude: 12.8456,
        longitude: 77.6603,
        type: 'Internship',
        description: 'Learn and contribute to frontend development projects.',
        salary: '₹25,000 - ₹40,000 per month',
        skillsRequired: ['HTML', 'CSS', 'JavaScript', 'React', 'Git'],
        perks: 'Mentorship program, Learning resources, Certificate, Potential full-time offer',
        whatYouDo: 'Assist in frontend development, learn modern web technologies, participate in code reviews, and work on real projects.',
        whatYouGoodAt: 'Basic knowledge of web technologies, eagerness to learn, good problem-solving skills, ability to work in a team.',
        aboutYou: 'You are a student or recent graduate passionate about web development. You are eager to learn and contribute to real-world projects.'
      },
      // DataDriven Inc jobs
      {
        user: createdCompanies[2]._id,
        title: 'Data Scientist',
        company: 'DataDriven Inc',
        location: 'Cyber City, Gurgaon, Haryana, India',
        latitude: 28.4595,
        longitude: 77.0266,
        type: 'Full-time',
        description: 'Analyze complex datasets and build predictive models for business insights.',
        salary: '₹12,00,000 - ₹20,00,000',
        skillsRequired: ['Python', 'R', 'SQL', 'Tableau', 'Machine Learning'],
        perks: 'Research time, Conference budget, Flexible work, Health benefits',
        whatYouDo: 'Analyze large datasets, build predictive models, create data visualizations, and present insights to stakeholders.',
        whatYouGoodAt: 'Strong analytical skills, proficiency in Python/R, experience with statistical modeling, data visualization expertise.',
        aboutYou: 'You are analytical and curious with a passion for extracting insights from data. You enjoy solving business problems through data-driven approaches.'
      },
      {
        user: createdCompanies[2]._id,
        title: 'Business Analyst',
        company: 'DataDriven Inc',
        location: 'Cyber City, Gurgaon, Haryana, India',
        latitude: 28.4595,
        longitude: 77.0266,
        type: 'Full-time',
        description: 'Bridge the gap between business requirements and technical solutions.',
        salary: '₹7,00,000 - ₹12,00,000',
        skillsRequired: ['SQL', 'Excel', 'Power BI', 'Business Process', 'Communication'],
        perks: 'Professional development, Flexible hours, Health insurance, Performance bonus',
        whatYouDo: 'Gather business requirements, analyze processes, create documentation, and work with technical teams to implement solutions.',
        whatYouGoodAt: 'Strong analytical thinking, excellent communication skills, experience with business analysis tools, understanding of business processes.',
        aboutYou: 'You are detail-oriented and enjoy understanding business processes. You have excellent communication skills and can work with both technical and non-technical teams.'
      },
      {
        user: createdCompanies[2]._id,
        title: 'Data Engineer',
        company: 'DataDriven Inc',
        location: 'Cyber City, Gurgaon, Haryana, India',
        latitude: 28.4595,
        longitude: 77.0266,
        type: 'Contract',
        description: 'Build and maintain data pipelines and infrastructure.',
        salary: '₹15,00,000 - ₹22,00,000',
        skillsRequired: ['Apache Spark', 'Kafka', 'Airflow', 'AWS', 'Python'],
        perks: 'High hourly rate, Remote work option, Latest tech stack, Project variety',
        whatYouDo: 'Design data pipelines, maintain data infrastructure, optimize data processing, and ensure data quality and reliability.',
        whatYouGoodAt: 'Experience with big data technologies, knowledge of data pipeline tools, cloud platform expertise, strong programming skills.',
        aboutYou: 'You are technically strong and enjoy working with large-scale data systems. You have experience with distributed computing and cloud technologies.'
      }
    ];

    // Create jobs
    for (const jobData of jobs) {
      const existingJob = await Job.findOne({ 
        title: jobData.title, 
        company: jobData.company 
      });
      
      if (!existingJob) {
        const newJob = new Job(jobData);
        await newJob.save();
        console.log(`Created job: ${jobData.title} at ${jobData.company}`);
      } else {
        console.log(`Job already exists: ${jobData.title} at ${jobData.company}`);
      }
    }

    console.log('Seed data creation completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

const runSeed = async () => {
  await connectDB();
  await seedData();
};

runSeed();