const actionButtons = document.querySelectorAll(".post-actions button, .event-card button, .composer button");

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.add("pulse");
    window.setTimeout(() => button.classList.remove("pulse"), 420);
  });
});

const style = document.createElement("style");
style.textContent = `
  .pulse {
    animation: petly-pulse 420ms ease;
  }

  @keyframes petly-pulse {
    0% { transform: scale(1); }
    45% { transform: scale(1.06); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);
