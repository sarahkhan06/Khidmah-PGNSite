// ============================================
// PGN UTD — contact.js
// ============================================

const MAJORS = [
  "Accounting",
  "Accounting and Analytics",
  "Actuarial Science",
  "American Studies",
  "Animation",
  "Animation and Games",
  "Applied Cognition and Neuroscience",
  "Applied Sociology",
  "Art History",
  "Artificial Intelligence for Biomedical Sciences",
  "Arts, Technology, and Emerging Communication",
  "Audiology",
  "Biochemistry",
  "Bioinformatics and Computational Biology",
  "Biology",
  "Biomedical Engineering",
  "Biomedical Sciences",
  "Biotechnology",
  "Business Administration",
  "Business Analytics and Artificial Intelligence",
  "Chemistry",
  "Child Learning and Development",
  "Cognition and Neuroscience",
  "Cognitive Science",
  "Computational and Geospatial Science",
  "Computer Engineering",
  "Computer Information Systems and Technology",
  "Computer Science",
  "Criminology",
  "Cyber Security, Technology, and Policy",
  "Cybersecurity and Risk Management",
  "Cybersecurity Technology and Policy",
  "Data Science",
  "Data Science and Statistics",
  "Economics",
  "Education",
  "Electrical Engineering",
  "Energy Management",
  "Engineering",
  "Finance",
  "Financial Technology and Analytics",
  "Game Development",
  "Geosciences",
  "Geospatial Information Sciences",
  "Global Business",
  "Healthcare Administration and Leadership",
  "Healthcare Leadership and Management",
  "Healthcare Management",
  "Healthcare Studies",
  "History",
  "Human Development and Early Childhood Disorders",
  "Human Resource Management",
  "Humanities",
  "Information Technology and Management",
  "Innovation and Entrepreneurship",
  "Interdisciplinary Studies",
  "International Management Studies",
  "International Political Economy",
  "Latin American Studies",
  "Leadership and Organizational Development",
  "Literature",
  "Management Science",
  "Marketing",
  "Materials Science and Engineering",
  "Mathematics",
  "Mathematics Education",
  "Mechanical Engineering",
  "Media Arts and Design",
  "Molecular and Cell Biology",
  "Molecular Biology",
  "Neuroscience",
  "Philosophy",
  "Physics",
  "Political Science",
  "Professional Communication and Digital Media Studies",
  "Psychology",
  "Public Affairs",
  "Public Health",
  "Public Policy",
  "Public Policy and Political Economy",
  "Science Education",
  "Social Data Analytics and Research",
  "Sociology",
  "Software Engineering",
  "Speech, Language, and Hearing Sciences",
  "Speech-Language Pathology",
  "Supply Chain Management",
  "Supply Chain Management and Analytics",
  "Sustainability Planning and Policy",
  "Systems Engineering",
  "Systems Engineering and Management",
  "Visual and Performing Arts",
  "Other"
];

function populateMajorOptions() {
  const majorSelect = document.getElementById('contact-major');
  if (!majorSelect) return;

  MAJORS.forEach(function (major) {
    const option = document.createElement('option');
    option.value = major;
    option.textContent = major;
    majorSelect.appendChild(option);
  });
}

function handleSubmit() {
  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const major = document.getElementById('contact-major').value;
  const year = document.getElementById('contact-year').value;
  const emailError = document.getElementById('contact-email-error');
  const formError = document.getElementById('contact-form-error');
  const emailPattern = /^[^\s@]+@utdallas\.edu$/i;

  emailError.classList.remove('show');
  formError.classList.remove('show');

  if (!name || !email || !major || !year || !emailPattern.test(email)) {
    if (!emailPattern.test(email)) {
      emailError.classList.add('show');
    }
    formError.textContent = 'Please complete all required fields and use a valid @utdallas.edu email.';
    formError.classList.add('show');
    return;
  }

  const btn = document.querySelector('.submit-btn');
  const confirm = document.getElementById('submit-confirm');

  btn.style.display = 'none';
  confirm.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function () {
  populateMajorOptions();
});
