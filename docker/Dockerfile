FROM osrf/ros:noetic-desktop-full

# Basic tools and dependencies and nodejs LTS PPA.
RUN apt update && apt install -y curl

RUN apt update && apt install -y curl && curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
    mkdir /rvizweb_ws && \
    cd /rvizweb_ws && \
    git clone https://github.com/Sausy/rvizweb.git src/rvizweb && \
    rosdep install --from-paths src --ignore-src -r -y && \
    . /opt/ros/melodic/setup.sh && catkin_make install && \
    apt-get clean

RUN curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash - && sudo apt-get install -y nodejs

# Install rvizweb.
WORKDIR /rvizweb_ws
ARG rvizweb_branch=master
RUN git clone https://github.com/yxzhan/rvizweb.git src/rvizweb -b ${rvizweb_branch}
RUN rosdep install --from-paths src --ignore-src -r -y
RUN . /opt/ros/kinetic/setup.sh && catkin_make install

# Clear apt cache.
RUN apt clean

ENTRYPOINT ["/bin/bash", "-c", "source /rvizweb_ws/install/setup.bash && roslaunch rvizweb rvizweb.launch"]

