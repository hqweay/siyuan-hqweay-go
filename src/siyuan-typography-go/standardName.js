const standardNameList = [
  "MySQL",
  "Redis",
  "MacOS",
  "iPhone",
  "iPad",
  "Java",
  "iOS",
  "GitHub",
  "GitLab",
  "Spring Boot",
  "Spring MVC",
  "Spring Cloud",
  "Spring Data JPA",
  "MyBatis",
  "Hibernate",
  "Oracle",
  "Maven",
  "IoC",
  "DI",
  "AOP",
  "JVM",
  "NoSQL",
  "SSO",
  "CAS",
  "HTTP ",
  "HTTPS ", //避免把https://转换了
  "VS Code",
  "JavaScript",
  "CSS",
  "JSON",
  "API",
  "AJAX",
  "HTML ",
  "JSP",
  "springboot:Spring Boot",
];
const standardNames = standardNameList.map((str) => {
  return {
    key: new RegExp("\\b" + str + "\\b", "gi"),
    value: str,
  };
});
export { standardNames };
