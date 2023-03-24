FROM osrf/ros:noetic-desktop-full

# Install tools
RUN apt update && apt install -y curl git python3-pip vim

# Install Nodejs (May need to update the version)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs

# Clone Rvizweb source code
WORKDIR /rvizweb_ws
ARG RVIZWEB_REPO=https://github.com/yxzhan/rvizweb.git
ARG RVIZWEB_BRANCH=master
RUN git clone ${RVIZWEB_REPO} src/rvizweb -b ${RVIZWEB_BRANCH}

# --- Optional, for demostration---
# Clone interactive_marker_proxy
RUN git clone https://github.com/dragandbot/interactive_marker_proxy.git src/interactive_marker_proxy -b bundle/v2.0.2
# Install PR2 Gazebo
RUN apt install -y ros-noetic-pr2-gazebo
# --- End Optional ---

# Install dependencies
RUN rosdep install --from-paths src --ignore-src -r -y

# Init catkin workspace and build packages
RUN /bin/bash -c "source /opt/ros/noetic/setup.bash && catkin_make"

# Clear apt cache.
RUN apt clean

RUN echo "source /rvizweb_ws/devel/setup.bash" >> /root/.bashrc

ENTRYPOINT ["/bin/bash", "-c", \
  "source /rvizweb_ws/devel/setup.bash && \
  roslaunch rvizweb demo.launch \
"]