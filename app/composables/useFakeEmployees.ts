import { faker } from '@faker-js/faker';

export type Employee = {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'on-leave';
  salary: number;
};

const departments: Record<string, string[]> = {
  Engineering: [
    'Senior Developer',
    'Junior Developer',
    'DevOps Engineer',
    'QA Engineer',
    'Staff Engineer',
    'Tech Lead',
  ],
  Design: ['Lead Designer', 'UI Designer', 'UX Researcher', 'Motion Designer', 'Brand Designer'],
  Marketing: [
    'Marketing Manager',
    'Content Writer',
    'SEO Specialist',
    'Growth Analyst',
    'Social Media Manager',
  ],
  Sales: ['Account Executive', 'Sales Manager', 'SDR', 'Solutions Engineer', 'VP Sales'],
  Finance: ['Accountant', 'Financial Analyst', 'Controller', 'Payroll Specialist'],
  'Human Resources': ['HR Manager', 'Recruiter', 'People Ops', 'Talent Acquisition Lead'],
};

const statuses: Employee['status'][] = [
  'active',
  'active',
  'active',
  'active',
  'inactive',
  'on-leave',
];

function createEmployee(id: number): Employee {
  const department = faker.helpers.objectKey(departments);
  const roles = departments[department]!;

  return {
    id,
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    department,
    role: faker.helpers.arrayElement(roles),
    status: faker.helpers.arrayElement(statuses),
    salary: faker.number.int({ min: 55000, max: 180000, multipleOf: 1000 }),
  };
}

export function useFakeEmployees(count = 200) {
  const data = ref<Employee[]>(Array.from({ length: count }, (_, i) => createEmployee(i + 1)));

  function regenerate(newCount?: number) {
    const total = newCount ?? data.value.length;
    data.value = Array.from({ length: total }, (_, i) => createEmployee(i + 1));
  }

  return { data, regenerate };
}
