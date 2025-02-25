import { FC } from 'react';

interface TimelineItem {
  date: string;
  company: string;
  position: string;
  description: string;
}

const timelineData: TimelineItem[] = [
  {
    date: "07/2022 - Present",
    company: "CoinedOne Technologies, Kochi, India",
    position: "Mobile Application Developer",
    description: "Led development of multiple React applications, implemented CI/CD pipelines, and mentored junior developers."
  },
  {
    date: "04/2022 - 06/2022",
    company: "NDimensionZ Solutions Pvt Ltd, Kochi, India",
    position: "Flutter Developer Intern",
    description: "Developed a mobile application for a client using Flutter, collaborated with the design team on UI/UX improvements."
  },
  // Add more experiences as needed
];

const Timeline: FC = () => {
  return (
    <section id="experience" className="py-20">
      <div className="container mx-auto px-4">
        {/* <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Work Experience</h2> */}
        <div className="relative">
          {/* Center line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
          
          {/* Timeline items */}
          <div className="relative">
            {timelineData.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between mb-8 w-full ${
                  index % 2 === 0 ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Content */}
                <div className="w-5/12">
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <span className="text-sm font-semibold text-blue-500 dark:text-blue-400">
                      {item.date}
                    </span>
                    <h3 className="text-xl font-bold mt-2 dark:text-white">
                      {item.position}
                    </h3>
                    <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mt-1">
                      {item.company}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Timeline dot */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Timeline; 