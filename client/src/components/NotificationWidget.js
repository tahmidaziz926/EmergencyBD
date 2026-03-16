const NotificationWidget = () => {
  return (
    <div style={styles.container} title="Notifications coming in Phase 3">
      <span style={styles.bell}>🔔</span>
      <span style={styles.badge}>0</span>
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    cursor: "pointer",
  },
  bell: {
    fontSize: "20px",
  },
  badge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    backgroundColor: "#00ff88",
    color: "#0a0a0a",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },
};

export default NotificationWidget;